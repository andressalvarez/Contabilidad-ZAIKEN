import * as fs from 'fs';
import * as path from 'path';

type BackupDistribucionUtilidades = any;
type BackupDistribucionDetalle = any;

type BackupDataFile = {
  exportDate: string;
  version: string;
  data: {
    rolesData: any[];
    personasData: any[];
    valorHoraData: any[];
    registroHorasData: any[];
    campanasData: any[];
    transaccionesData: BackupTransaccion[];
    distribucionUtilidadesData: BackupDistribucionUtilidades[];
    distribucionDetalleData: BackupDistribucionDetalle[];
    categoriasData: BackupCategoria[];
  };
};

interface BackupTransaccion {
  id?: number;
  fecha: string;
  tipo: string; // "Gasto" | "Ingreso" | "Aporte"
  concepto: string;
  categoria?: string | number;
  monto: number;
  moneda?: string;
  personaId?: number;
  campanaId?: number;
  companyId?: number;
  notas?: string;
}

interface BackupCategoria {
  id?: number;
  nombre?: string;
  nombreCategoria?: string;
}

type AuditRow = {
  index: number;
  fecha: string;
  concepto: string;
  monto: number;
  tipo: string;
  personaId?: number;
  campanaId?: number;
  companyId?: number;
  categoria?: string | number;
  reasons: string[];
};

const VALID_TIPOS = new Set(['Gasto', 'Ingreso', 'Aporte']);

function isValidDateString(value?: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return Number.isFinite(d.getTime());
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function toCSV(rows: AuditRow[]): string {
  const headers = ['index','fecha','concepto','monto','tipo','personaId','campanaId','companyId','categoria','reasons'];
  const escape = (v: any) => {
    if (v === undefined || v === null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.index,
      escape(r.fecha),
      escape(r.concepto),
      r.monto,
      r.tipo,
      r.personaId ?? '',
      r.campanaId ?? '',
      r.companyId ?? '',
      escape(r.categoria ?? ''),
      escape(r.reasons.join('|')),
    ].join(','));
  }
  return lines.join('\n');
}

async function main() {
  try {
    const backupArg = process.argv.find(a => a.endsWith('.json'));
    const jsonPath = backupArg || path.resolve(process.cwd(), '../backup_2025-07-15.json');
    const abs = path.isAbsolute(jsonPath) ? jsonPath : path.resolve(jsonPath);
    if (!fs.existsSync(abs)) {
      throw new Error(`Archivo no encontrado: ${abs}`);
    }

    const raw = fs.readFileSync(abs, 'utf8');
    const backup = JSON.parse(raw) as BackupDataFile;

    // Construir set de categorias del backup para detectar IDs numéricos inválidos
    const validCategoryIds = new Set<number>();
    for (const c of backup.data.categoriasData || []) {
      if (typeof c.id === 'number') validCategoryIds.add(c.id);
    }

    const rows: AuditRow[] = [];
    const reasonsCounter: Record<string, number> = {};

    backup.data.transaccionesData.forEach((t, idx) => {
      const reasons: string[] = [];

      // Básicos
      if (!isValidDateString(t.fecha)) reasons.push('INVALID_FECHA');
      if (!t.concepto || String(t.concepto).trim() === '') reasons.push('INVALID_CONCEPTO');
      if (!t.monto || typeof t.monto !== 'number' || t.monto <= 0) reasons.push('INVALID_MONTO');
      if (!t.tipo || !VALID_TIPOS.has(t.tipo)) reasons.push('INVALID_TIPO');

      // Campaña obligatoria en importador (campanaId o companyId)
      if (!t.campanaId && !t.companyId) reasons.push('MISSING_CAMPANA');

      // Categoria numérica que no aparece en categoriasData del backup
      if (typeof t.categoria === 'number' && !validCategoryIds.has(t.categoria)) {
        reasons.push('CATEGORIA_ID_NOT_IN_BACKUP');
      }

      if (reasons.length > 0) {
        reasons.forEach(r => { reasonsCounter[r] = (reasonsCounter[r] ?? 0) + 1; });
        rows.push({
          index: idx + 1,
          fecha: t.fecha,
          concepto: t.concepto,
          monto: t.monto,
          tipo: t.tipo,
          personaId: t.personaId,
          campanaId: t.campanaId,
          companyId: t.companyId,
          categoria: t.categoria,
          reasons,
        });
      }
    });

    const outDir = path.resolve(__dirname, '..', 'logs');
    ensureDir(outDir);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonOut = path.join(outDir, `import-audit-${stamp}.json`);
    const csvOut = path.join(outDir, `import-audit-${stamp}.csv`);

    fs.writeFileSync(jsonOut, JSON.stringify({ summary: reasonsCounter, total: rows.length, rows }, null, 2), 'utf8');
    fs.writeFileSync(csvOut, toCSV(rows), 'utf8');

    console.log('✅ Auditoría generada');
    console.log('Resumen razones:', reasonsCounter);
    console.log('Total con incidencias:', rows.length);
    console.log('Archivos:');
    console.log('  JSON ->', jsonOut);
    console.log('  CSV  ->', csvOut);
  } catch (e: any) {
    console.error('❌ Error en auditoría:', e?.message || e);
    process.exit(1);
  }
}

main();


