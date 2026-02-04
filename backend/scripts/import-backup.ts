// @ts-nocheck
// scripts/import-backup.ts
// Ejecuta: npm run import:backup:new [rutaJSON]
// NOTA: Script legacy - requiere actualización para multi-tenant

import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/****************************
 * Logger sencillo
 ****************************/
interface ILogger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string, e?: any): void;
  ok(msg: string): void;
}
class Logger implements ILogger {
  info(m: string) { console.log(`ℹ️  ${m}`); }
  warn(m: string) { console.warn(`⚠️  ${m}`); }
  error(m: string, e?: any) { console.error(`❌ ${m}`); if (e) console.error(e); }
  ok(m: string) { console.log(`✅ ${m}`); }
}

type ImportStats = { imported: number; skipped: number; errors: string[] };
const emptyStats = (): ImportStats => ({ imported: 0, skipped: 0, errors: [] });

/****************************
 * Tipos del backup
 ****************************/
export type BackupDataFile = {
  exportDate: string;
  version: string;
  data: {
    rolesData: BackupRol[];
    personasData: BackupPersona[];
    valorHoraData: BackupValorHora[];
    registroHorasData: BackupRegistroHoras[];
    campanasData: BackupCampana[];
    transaccionesData: BackupTransaccion[];
    distribucionUtilidadesData: BackupDistribucionUtilidades[];
    distribucionDetalleData: BackupDistribucionDetalle[];
    categoriasData: BackupCategoria[];
  };
  configPersonalizada?: any;
};

export interface BackupRol {
  id?: number;
  nombreRol: string;
  importancia: number;
  descripcion?: string;
}
export interface BackupPersona {
  id?: number;
  nombre: string;
  rolId: number;
  horasTotales: number;
  aportesTotales: number;
  valorHora: number;
  inversionHoras: number;
  inversionTotal: number;
  participacionPorc: number;
  notas?: string;
  email?: string;
}
export interface BackupValorHora {
  id?: number;
  personaId: number;
  rolId: number;
  valor: number;
  notas?: string;
  fechaInicio?: string;
  fechaFin?: string | null;
}
export interface BackupRegistroHoras {
  id?: number;
  personaId: number;
  campanaId?: number;
  companyId?: number; // fallback legacy
  fecha: string;
  horas: number;
  descripcion?: string;
  aprobado?: boolean;
}
export interface BackupCampana {
  id?: number;
  nombre: string;
  fechaInicio: string;
  fechaFin?: string;
  presupuesto?: number;
  objetivoIngresos?: number;
  horasInvertidas?: number;
  gastoTotalReal?: number;
  ingresoTotalReal?: number;
  rentabilidadReal?: number;
  notas?: string;
  activo?: boolean;
}
export interface BackupTransaccion {
  id?: number;
  fecha: string;
  tipo: string;
  concepto: string;
  categoria?: string | number;
  monto: number;
  moneda?: string;
  personaId?: number;
  campanaId?: number;
  companyId?: number; // fallback legacy
  notas?: string;
  comprobante?: string;
  aprobado?: boolean;
}
export interface BackupCategoria {
  id?: number;
  nombre?: string;
  nombreCategoria?: string;
  fechaCreacion?: string;
  activa?: boolean;
}
export interface BackupDistribucionUtilidades {
  id?: number;
  periodo: string;
  fecha: string;
  utilidadTotal: number;
  estado?: string;
}
export interface BackupDistribucionDetalle {
  id?: number;
  distribucionId: number;
  personaId: number;
  porcentajeParticipacion: number;
  montoDistribuido: number;
}

/****************************
 * Helpers
 ****************************/
const VALID_TIPOS = ['Gasto', 'Ingreso', 'Aporte'] as const;
const TIPO_DB: Record<string, string> = { Gasto: 'GASTO', Ingreso: 'INGRESO', Aporte: 'APORTE' };

const toDate = (d?: string | null): Date | null => {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};
const ensureNumber = (n: any, def = 0): number => (typeof n === 'number' && !isNaN(n) ? n : def);
const isEmpty = (s?: string | null) => !s || s.trim() === '';

/****************************
 * Import Service
 ****************************/
class ImportService {
  prisma = new PrismaClient();
  log: ILogger = new Logger();

  // caches
  categoriaByName = new Map<string, number>();
  categoriaById = new Map<number, number>();
  tipoByName = new Map<string, number>();
  personaIdMap = new Map<number, number>();
  campanaIdMap = new Map<number, number>();
  rolIdMap = new Map<number, number>();

  async run(filePath: string, opts: { wipeTx?: boolean; wipeAll?: boolean } = {}) {
    try {
      const backup = this.readBackup(filePath);
      this.log.info(`Backup date: ${backup.exportDate} v${backup.version}`);

      // 🔥 LIMPIEZAS OPCIONALES
      if (opts.wipeAll) {
        await this.wipeAll();
      } else if (opts.wipeTx) {
        await this.wipeOnlyTransacciones();
      }

      await this.loadExistingCaches();

      await this.importRoles(backup.data.rolesData);
      await this.importPersonas(backup.data.personasData);
      await this.importValorHoras(backup.data.valorHoraData);
      await this.importCampanas(backup.data.campanasData);
      await this.importCategorias(backup.data.categoriasData);
      await this.ensureTiposTransaccion(backup.data.transaccionesData);

      // 🔍 PRE-SCAN PARA DEBUGGING
      this.preScanTransacciones(backup.data.transaccionesData);

      await this.importTransacciones(backup.data.transaccionesData);
      await this.importRegistroHoras(backup.data.registroHorasData);
      await this.importDistribucion(backup.data.distribucionUtilidadesData, backup.data.distribucionDetalleData);

      this.log.ok('🎉 Importación completa');
    } catch (e) {
      this.log.error('Fallo global en importación', e);
      process.exitCode = 1;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  // ---------- PRELOAD ----------
  async loadExistingCaches() {
    const cats = await this.prisma.categoria.findMany();
    cats.forEach(c => {
      this.categoriaByName.set(c.nombre, c.id);
      this.categoriaById.set(c.id, c.id);
    });

    const tipos = await this.prisma.tipoTransaccion.findMany();
    tipos.forEach(t => this.tipoByName.set(t.nombre, t.id));

    const pers = await this.prisma.persona.findMany();
    pers.forEach(p => this.personaIdMap.set(p.id, p.id));

    const roles = await this.prisma.rol.findMany();
    roles.forEach(r => this.rolIdMap.set(r.id, r.id));

    const camps = await this.prisma.campana.findMany();
    camps.forEach(c => this.campanaIdMap.set(c.id, c.id));

    this.log.info(`Caches -> categorias:${cats.length} tipos:${tipos.length} personas:${pers.length} roles:${roles.length} campanas:${camps.length}`);
  }

  // 🔥 FUNCIONES DE LIMPIEZA
  private async wipeOnlyTransacciones() {
    this.log.warn('Borrando SOLO transacciones, registro_horas, distribucion_detalles/utilidades…');
    await this.prisma.$transaction([
      this.prisma.transaccion.deleteMany({}),
      this.prisma.registroHoras.deleteMany({}),
      this.prisma.distribucionDetalle.deleteMany({}),
      this.prisma.distribucionUtilidades.deleteMany({})
    ]);
    this.log.ok('Tablas financieras limpiadas.');
  }

  private async wipeAll() {
    this.log.warn('Borrando TODO el contenido (orden correcto)…');
    await this.prisma.$transaction([
      this.prisma.transaccion.deleteMany({}),
      this.prisma.registroHoras.deleteMany({}),
      this.prisma.distribucionDetalle.deleteMany({}),
      this.prisma.distribucionUtilidades.deleteMany({}),
      this.prisma.valorHora.deleteMany({}),
      this.prisma.persona.deleteMany({}),
      this.prisma.rol.deleteMany({}),
      this.prisma.categoria.deleteMany({}),
      this.prisma.campana.deleteMany({}),
      this.prisma.tipoTransaccion.deleteMany({})
    ]);
    this.log.ok('Base vacía.');
  }

  // ---------- READ FILE ----------
  readBackup(p: string): BackupDataFile {
    const abs = path.resolve(p);
    if (!fs.existsSync(abs)) throw new Error(`No existe el archivo ${abs}`);
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  }

  // 🔍 PRE-SCAN PARA DEBUGGING
  private preScanTransacciones(data: BackupTransaccion[]) {
    const noCampana = data.filter(t => !t.campanaId && !t.companyId);
    if (noCampana.length) {
      this.log.warn(`Transacciones SIN campanaId: ${noCampana.length}`);
      noCampana.slice(0, 10).forEach(t =>
        this.log.warn(`  • ${t.fecha} - ${t.concepto} - $${t.monto}`)
      );
      if (noCampana.length > 10) this.log.warn('  … (más registros sin campanaId)');
    }
  }

  // ---------- ROLES ----------
  async importRoles(data: BackupRol[]) {
    const stats = emptyStats();
    for (const r of data) {
      if (isEmpty(r.nombreRol)) { stats.skipped++; continue; }

      const created = await this.prisma.rol.upsert({
        where: { nombreRol: r.nombreRol },
        update: { importancia: r.importancia ?? 0, descripcion: r.descripcion ?? '' },
        create: { nombreRol: r.nombreRol, importancia: r.importancia ?? 0, descripcion: r.descripcion ?? '' }
      });

      this.rolIdMap.set(r.id ?? created.id, created.id);
      stats.imported++;
    }
    this.log.ok(`Roles: +${stats.imported}, skip:${stats.skipped}`);
  }

  // ---------- PERSONAS ----------
  async importPersonas(data: BackupPersona[]) {
    const stats = emptyStats();
    for (const p of data) {
      if (isEmpty(p.nombre)) { stats.skipped++; continue; }

      const rolId = this.rolIdMap.get(p.rolId);
      if (!rolId) this.log.warn(`Rol ${p.rolId} no existe (persona ${p.nombre})`);

      const created = await this.prisma.persona.upsert({
        where: { nombre: p.nombre },
        update: {
          rolId: rolId ?? p.rolId,
          horasTotales: ensureNumber(p.horasTotales),
          aportesTotales: ensureNumber(p.aportesTotales),
          valorHora: ensureNumber(p.valorHora),
          inversionHoras: ensureNumber(p.inversionHoras),
          inversionTotal: ensureNumber(p.inversionTotal),
          participacionPorc: ensureNumber(p.participacionPorc),
          notas: p.notas ?? '',
          email: p.email ?? null,
          activo: true
        },
        create: {
          nombre: p.nombre,
          rolId: rolId ?? p.rolId,
          horasTotales: ensureNumber(p.horasTotales),
          aportesTotales: ensureNumber(p.aportesTotales),
          valorHora: ensureNumber(p.valorHora),
          inversionHoras: ensureNumber(p.inversionHoras),
          inversionTotal: ensureNumber(p.inversionTotal),
          participacionPorc: ensureNumber(p.participacionPorc),
          notas: p.notas ?? '',
          email: p.email ?? null,
          activo: true
        }
      });

      this.personaIdMap.set(p.id ?? created.id, created.id);
      stats.imported++;
    }
    this.log.ok(`Personas: +${stats.imported}, skip:${stats.skipped}`);
  }

  // ---------- VALOR HORAS ----------
  async importValorHoras(data: BackupValorHora[]) {
    const stats = emptyStats();
    for (const v of data) {
      const personaId = this.personaIdMap.get(v.personaId);
      const rolId = this.rolIdMap.get(v.rolId);
      if (!personaId || !rolId) { stats.skipped++; continue; }

      await this.prisma.valorHora.create({
        data: {
          personaId,
          rolId,
          valor: ensureNumber(v.valor),
          notas: v.notas ?? '',
          fechaInicio: toDate(v.fechaInicio) ?? new Date(),
          fechaFin: toDate(v.fechaFin),
          activo: true
        }
      });
      stats.imported++;
    }
    this.log.ok(`Valor_horas: +${stats.imported}, skip:${stats.skipped}`);
  }

  // ---------- CAMPANAS ----------
  async importCampanas(data: BackupCampana[]) {
    const stats = emptyStats();
    for (const c of data) {
      if (isEmpty(c.nombre)) { stats.skipped++; continue; }

      const existing = await this.prisma.campana.findFirst({ where: { nombre: c.nombre }});
      const payload: Prisma.CampanaUpdateInput = {
        nombre: c.nombre,
        descripcion: c.notas ?? '',
        fechaInicio: toDate(c.fechaInicio) ?? new Date(),
        fechaFin: toDate(c.fechaFin) ?? undefined,
        presupuesto: c.presupuesto != null ? c.presupuesto : undefined,
        ingresoTotal: ensureNumber(c.ingresoTotalReal),
        gastoTotal: ensureNumber(c.gastoTotalReal),
        utilidad: ensureNumber(c.rentabilidadReal),
        activo: c.activo ?? true
      };

      const created = existing
        ? await this.prisma.campana.update({ where: { id: existing.id }, data: payload })
        : await this.prisma.campana.create({ data: payload as any });

      this.campanaIdMap.set(c.id ?? created.id, created.id);
      stats.imported++;
    }
    this.log.ok(`Campañas: +${stats.imported}, skip:${stats.skipped}`);
  }

  // ---------- CATEGORIAS ----------
  async importCategorias(data: BackupCategoria[]) {
    if (!data?.length) return;
    const stats = emptyStats();

    for (const cat of data) {
      const name = (cat.nombre ?? cat.nombreCategoria ?? '').trim();
      if (isEmpty(name)) { stats.skipped++; continue; }

      const existing = await this.prisma.categoria.findFirst({ where: { nombre: name }});
      const payload = {
        nombre: name,
        descripcion: 'Importada automáticamente',
        color: null as string | null,
        activo: cat.activa ?? true
      };

      const created = existing
        ? await this.prisma.categoria.update({ where: { id: existing.id }, data: payload })
        : await this.prisma.categoria.create({ data: payload });

      this.categoriaByName.set(name, created.id);
      if (cat.id) this.categoriaById.set(cat.id, created.id);
      stats.imported++;
    }
    this.log.ok(`Categorías: +${stats.imported}, skip:${stats.skipped}`);
  }

  // ---------- TIPOS DE TRANSACCION ----------
  async ensureTiposTransaccion(trans: BackupTransaccion[]) {
    const uniqueTipos = Array.from(new Set(trans.map(t => t.tipo))).filter(Boolean);
    for (const t of uniqueTipos) {
      if (!VALID_TIPOS.includes(t as any)) {
        this.log.warn(`Tipo de transacción desconocido "${t}", se fuerza a GASTO`);
      }
      const dbName = TIPO_DB[t] ?? 'GASTO';
      if (!this.tipoByName.has(dbName)) {
        const created = await this.prisma.tipoTransaccion.create({
          data: { nombre: dbName, descripcion: `Importado (${t})`, activo: true }
        });
        this.tipoByName.set(dbName, created.id);
      }
    }
  }

  // ---------- TRANSACCIONES ----------
  async importTransacciones(data: BackupTransaccion[]) {
    const stats = emptyStats();
    const BATCH = 200;

    // NUEVO: contadores de razones
    const skipReasons: Record<string, number> = {};

    // helper para marcar skip y loggear
    const markSkip = (reason: string, t: BackupTransaccion, extra?: string) => {
      skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
      stats.skipped++;
      this.log.warn(`[TX SKIP ${reason}] concepto="${t.concepto}" fecha="${t.fecha}" monto=${t.monto} ${extra ?? ''}`);
    };

    for (let i = 0; i < data.length; i += BATCH) {
      const slice = data.slice(i, i + BATCH);

      await this.prisma.$transaction(async (tx) => {
        for (const t of slice) {
          // 1) Validaciones básicas
          if (!t.fecha || isNaN(Date.parse(t.fecha)) || isEmpty(t.concepto) || isEmpty(t.tipo) || !VALID_TIPOS.includes(t.tipo as any) || !t.monto) {
            markSkip('INVALID_BASICS', t, '(fecha/tipo/concepto/monto)');
            continue;
          }

          // 2) Tipo
          const tipoNombre = TIPO_DB[t.tipo] ?? 'GASTO';
          const tipoId = this.tipoByName.get(tipoNombre);
          if (!tipoId) {
            markSkip('TIPO_NOT_FOUND', t, `(mapeado: ${tipoNombre})`);
            continue;
          }

          // 3) Persona / Campaña
          const personaId = t.personaId ? this.personaIdMap.get(t.personaId) ?? null : null;
          const rawCampId = t.campanaId ?? t.companyId;

          // NUEVO: Si falta campana, asignar a campaña 1 por requerimiento
          const rawOrDefaultCampId = rawCampId ?? 1;
          const campanaId = this.campanaIdMap.get(rawOrDefaultCampId) ?? rawOrDefaultCampId;

          // 4) Categoría
          let categoriaId: number | null = null;
          if (typeof t.categoria === 'number') {
            categoriaId = this.categoriaById.get(t.categoria) ?? null;
            if (t.categoria && !categoriaId) {
              markSkip('CATEGORIA_ID_NOT_MAPPED', t, `(catId backup: ${t.categoria})`);
              continue;
            }
          } else if (!isEmpty(t.categoria)) {
            const name = (t.categoria as string).trim();
            if (this.categoriaByName.has(name)) {
              categoriaId = this.categoriaByName.get(name)!;
            } else {
              // la creamos
              const created = await tx.categoria.create({
                data: { nombre: name, descripcion: 'Importada automáticamente', activo: true }
              });
              this.categoriaByName.set(name, created.id);
              categoriaId = created.id;
            }
          }

          // 5) Duplicados
          const exists = await tx.transaccion.findFirst({
            where: { fecha: new Date(t.fecha), concepto: t.concepto, monto: t.monto }
          });
          if (exists) {
            markSkip('DUPLICATE', t);
            continue;
          }

          // 6) Crear
          await tx.transaccion.create({
            data: {
              tipoId,
              monto: t.monto,
              concepto: t.concepto,
              fecha: new Date(t.fecha),
              categoriaId,
              personaId,
              campanaId,
              moneda: t.moneda ?? 'COP',
              notas: t.notas ?? '',
              comprobante: t.comprobante ?? null,
              aprobado: t.aprobado ?? true
            }
          });
          stats.imported++;
        }
      });
    }

    this.log.ok(`Transacciones: +${stats.imported}, skip:${stats.skipped}`);

    // NUEVO: resumen de razones
    if (stats.skipped > 0) {
      const resumen = Object.entries(skipReasons)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
      this.log.warn(`Transacciones omitidas por razón -> ${resumen}`);
    }

    if (stats.errors.length) this.log.error('Errores transacciones', stats.errors);
  }

  // ---------- REGISTRO HORAS ----------
  async importRegistroHoras(data: BackupRegistroHoras[]) {
    if (!data?.length) return;
    const stats = emptyStats();
    const BATCH = 200;

    for (let i = 0; i < data.length; i += BATCH) {
      const slice = data.slice(i, i + BATCH);
      await this.prisma.$transaction(async (tx) => {
        for (const r of slice) {
          if (!r.personaId || !r.fecha || isNaN(Date.parse(r.fecha))) { stats.skipped++; continue; }
          const personaId = this.personaIdMap.get(r.personaId);
          if (!personaId) { stats.skipped++; continue; }

          const campIdRaw = r.campanaId ?? r.companyId;
          const campanaId = campIdRaw ? this.campanaIdMap.get(campIdRaw) ?? null : null;

          await tx.registroHoras.create({
            data: {
              personaId,
              campanaId,
              fecha: new Date(r.fecha),
              horas: ensureNumber(r.horas),
              descripcion: r.descripcion ?? '',
              aprobado: r.aprobado ?? false
            }
          });
          stats.imported++;
        }
      });
    }
    this.log.ok(`Registro_horas: +${stats.imported}, skip:${stats.skipped}`);
  }

  // ---------- DISTRIBUCIÓN ----------
  async importDistribucion(headers: BackupDistribucionUtilidades[], details: BackupDistribucionDetalle[]) {
    if (!headers?.length) return;

    const statsH = emptyStats();
    for (const d of headers) {
      const existing = await this.prisma.distribucionUtilidades.findFirst({ where: { periodo: d.periodo }});
      const payload = {
        periodo: d.periodo,
        fecha: toDate(d.fecha) ?? new Date(),
        utilidadTotal: ensureNumber(d.utilidadTotal),
        estado: d.estado ?? 'Pendiente'
      };

      if (existing) {
        await this.prisma.distribucionUtilidades.update({ where: { id: existing.id }, data: payload });
      } else {
        await this.prisma.distribucionUtilidades.create({ data: payload });
      }
      statsH.imported++;
    }
    this.log.ok(`Distribucion_utilidades: +${statsH.imported}`);

    if (!details?.length) return;
    const statsD = emptyStats();
    for (const det of details) {
      const personaId = this.personaIdMap.get(det.personaId);
      if (!personaId) { statsD.skipped++; continue; }

      await this.prisma.distribucionDetalle.create({
        data: {
          distribucionId: det.distribucionId,
          personaId,
          porcentajeParticipacion: ensureNumber(det.porcentajeParticipacion),
          montoDistribuido: ensureNumber(det.montoDistribuido)
        }
      });
      statsD.imported++;
    }
    this.log.ok(`Distribucion_detalles: +${statsD.imported}, skip:${statsD.skipped}`);
  }
}

/****************************
 * MAIN
 ****************************/
if (require.main === module) {
  const argv = process.argv.slice(2);
  const file = argv.find(a => a.endsWith('.json')) || './backup_2025-07-15.json';

  const wipeTx  = argv.includes('--wipe-tx');
  const wipeAll = argv.includes('--wipe-all');

  new ImportService().run(file, { wipeTx, wipeAll }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

export { ImportService };
