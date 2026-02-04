// @ts-nocheck
// NOTA: Script legacy - requiere actualización para multi-tenant
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// ========================= INTERFACES (Dependency Inversion) =========================

interface ILogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: any): void;
  success(message: string): void;
}

interface IDataValidator<T> {
  validate(data: T): boolean;
  getErrors(): string[];
}

interface IEntityImporter<TBackup, TEntity> {
  import(data: TBackup[]): Promise<ImportResult<TEntity>>;
  getName(): string;
}

interface IDataMapper<TFrom, TTo> {
  map(from: TFrom): Promise<TTo>;
}

// ========================= TYPES & DATA STRUCTURES =========================

interface ImportResult<T> {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  data?: T[];
}

interface BackupData {
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
  configPersonalizada: any;
}

// Backup Types
interface BackupRol {
  id?: number;
  nombreRol: string;
  importancia: number;
  descripcion?: string;
}

interface BackupPersona {
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
}

interface BackupValorHora {
  id?: number;
  personaId: number;
  rolId: number;
  valor: number;
  notas?: string;
}

interface BackupRegistroHoras {
  id?: number;
  personaId: number;
  campanaId?: number;
  fecha: string;
  horas: number;
  descripcion?: string;
  aprobado?: boolean;
}

interface BackupCampana {
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
}

interface BackupTransaccion {
  id?: number;
  fecha: string;
  tipo: string; // "Gasto", "Ingreso", "Aporte"
  concepto: string;
  categoria?: string; // String directo, no ID
  monto: number;
  moneda?: string;
  personaId?: number;
  campanaId?: number;
  notas?: string;
}

interface BackupCategoria {
  id?: number;
  nombre?: string;
  nombreCategoria?: string; // Compatibilidad
  fechaCreacion?: string;
  activa?: boolean;
}

interface BackupDistribucionUtilidades {
  id?: number;
  periodo: string;
  fecha: string;
  utilidadTotal: number;
  estado?: string;
}

interface BackupDistribucionDetalle {
  id?: number;
  distribucionId: number;
  personaId: number;
  porcentajeParticipacion: number;
  montoDistribuido: number;
}

// ========================= LOGGER IMPLEMENTATION =========================

class ConsoleLogger implements ILogger {
  info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  warn(message: string): void {
    console.warn(`⚠️  ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`❌ ${message}`, error ? `\n${error}` : '');
  }

  success(message: string): void {
    console.log(`✅ ${message}`);
  }
}

// ========================= VALIDATORS =========================

class BaseValidator<T> implements IDataValidator<T> {
  protected errors: string[] = [];

  validate(data: T): boolean {
    this.errors = [];
    return this.performValidation(data);
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  protected performValidation(data: T): boolean {
    return true; // Override in subclasses
  }

  protected addError(message: string): void {
    this.errors.push(message);
  }
}

class PersonaValidator extends BaseValidator<BackupPersona> {
  protected performValidation(data: BackupPersona): boolean {
    if (!data.nombre) this.addError('Nombre requerido');
    if (!data.rolId) this.addError('RolId requerido');
    if (typeof data.horasTotales !== 'number') this.addError('HorasTotales debe ser un número');
    if (typeof data.aportesTotales !== 'number') this.addError('AportesTotales debe ser un número');
    if (typeof data.valorHora !== 'number') this.addError('ValorHora debe ser un número');
    if (typeof data.participacionPorc !== 'number') this.addError('ParticipacionPorc debe ser un número');

    return this.errors.length === 0;
  }
}

class TransaccionValidator extends BaseValidator<BackupTransaccion> {
  protected performValidation(data: BackupTransaccion): boolean {
    if (!data.fecha) this.addError('Fecha requerida');
    if (!data.tipo) this.addError('Tipo requerido');
    if (!data.concepto) this.addError('Concepto requerido');
    if (!data.monto || data.monto <= 0) this.addError('Monto debe ser mayor a 0');

    const tiposValidos = ['Gasto', 'Ingreso', 'Aporte'];
    if (!tiposValidos.includes(data.tipo)) {
      this.addError(`Tipo '${data.tipo}' no válido. Debe ser: ${tiposValidos.join(', ')}`);
    }

    // Validar fecha
    if (data.fecha && isNaN(Date.parse(data.fecha))) {
      this.addError(`Fecha '${data.fecha}' no es válida`);
    }

    return this.errors.length === 0;
  }
}

// ========================= DATA MAPPERS =========================

class TipoTransaccionMapper {
  private static readonly TIPO_MAP = {
    'Gasto': 'GASTO',
    'Ingreso': 'INGRESO',
    'Aporte': 'APORTE'
  };

  static mapToDbType(backupTipo: string): string {
    return this.TIPO_MAP[backupTipo as keyof typeof this.TIPO_MAP] || 'GASTO';
  }
}

class CategoryMapper {
  private prisma: PrismaClient;
  private categoryCache = new Map<string, number>();
  private logger: ILogger;

  constructor(prisma: PrismaClient, logger: ILogger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    // Cargar categorías existentes
    const existingCategories = await this.prisma.categoria.findMany();
    existingCategories.forEach(cat => {
      this.categoryCache.set(cat.nombre, cat.id);
    });
    this.logger.info(`Cargadas ${existingCategories.length} categorías existentes`);
  }

  async getCategoryId(categoryName: string | undefined): Promise<number | null> {
    if (!categoryName || categoryName.trim() === '') {
      return null; // Sin categoría
    }

    const cleanName = categoryName.trim();

    // Verificar cache
    if (this.categoryCache.has(cleanName)) {
      return this.categoryCache.get(cleanName)!;
    }

    // Crear nueva categoría
    try {
      const newCategory = await this.prisma.categoria.create({
        data: {
          nombre: cleanName,
          descripcion: `Importada automáticamente desde backup`,
          activo: true
        }
      });

      this.categoryCache.set(cleanName, newCategory.id);
      this.logger.info(`Nueva categoría creada: "${cleanName}" (ID: ${newCategory.id})`);
      return newCategory.id;
    } catch (error) {
      this.logger.error(`Error creando categoría "${cleanName}"`, error);
      return null;
    }
  }
}

// ========================= ENTITY IMPORTERS =========================

abstract class BaseImporter<TBackup, TEntity> implements IEntityImporter<TBackup, TEntity> {
  protected prisma: PrismaClient;
  protected logger: ILogger;
  protected validator: IDataValidator<TBackup>;

  constructor(prisma: PrismaClient, logger: ILogger, validator: IDataValidator<TBackup>) {
    this.prisma = prisma;
    this.logger = logger;
    this.validator = validator;
  }

  abstract getName(): string;
  protected abstract importSingle(data: TBackup): Promise<TEntity>;

  async import(data: TBackup[]): Promise<ImportResult<TEntity>> {
    const result: ImportResult<TEntity> = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      data: []
    };

    this.logger.info(`🔄 Importando ${this.getName()}... (${data.length} registros)`);

    for (const [index, item] of data.entries()) {
      try {
        // Validar datos
        if (!this.validator.validate(item)) {
          const errors = this.validator.getErrors();
          const errorMsg = `${this.getName()} ${index + 1}: ${errors.join(', ')}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
          result.skipped++;
          continue;
        }

        // Importar
        const imported = await this.importSingle(item);
        result.data!.push(imported);
        result.imported++;

      } catch (error) {
        const errorMsg = `${this.getName()} ${index + 1}: ${error.message || error}`;
        this.logger.error(errorMsg, error);
        result.errors.push(errorMsg);
        result.skipped++;
        result.success = false;
      }
    }

    this.logger.success(`${this.getName()}: ${result.imported} importados, ${result.skipped} omitidos`);
    if (result.errors.length > 0) {
      this.logger.error(`Errores encontrados en ${this.getName()}:`);
      result.errors.slice(0, 5).forEach(error => this.logger.error(`  - ${error}`));
      if (result.errors.length > 5) {
        this.logger.error(`  ... y ${result.errors.length - 5} errores más`);
      }
    }
    return result;
  }
}

class RolImporter extends BaseImporter<BackupRol, any> {
  constructor(prisma: PrismaClient, logger: ILogger) {
    super(prisma, logger, new BaseValidator<BackupRol>());
  }

  getName(): string {
    return 'Roles';
  }

  protected async importSingle(data: BackupRol): Promise<any> {
    return await this.prisma.rol.upsert({
      where: { nombreRol: data.nombreRol },
      update: {
        importancia: data.importancia,
        descripcion: data.descripcion || ''
      },
      create: {
        nombreRol: data.nombreRol,
        importancia: data.importancia,
        descripcion: data.descripcion || ''
      }
    });
  }
}

class PersonaImporter extends BaseImporter<BackupPersona, any> {
  constructor(prisma: PrismaClient, logger: ILogger) {
    super(prisma, logger, new PersonaValidator());
  }

  getName(): string {
    return 'Personas';
  }

  protected async importSingle(data: BackupPersona): Promise<any> {
    return await this.prisma.persona.upsert({
      where: { nombre: data.nombre },
      update: {
        rolId: data.rolId,
        horasTotales: data.horasTotales,
        aportesTotales: data.aportesTotales,
        valorHora: data.valorHora,
        inversionHoras: data.inversionHoras,
        inversionTotal: data.inversionTotal,
        participacionPorc: data.participacionPorc,
        notas: data.notas || ''
      },
      create: {
        nombre: data.nombre,
        rolId: data.rolId,
        horasTotales: data.horasTotales,
        aportesTotales: data.aportesTotales,
        valorHora: data.valorHora,
        inversionHoras: data.inversionHoras,
        inversionTotal: data.inversionTotal,
        participacionPorc: data.participacionPorc,
        notas: data.notas || ''
      }
    });
  }
}

class CampanaImporter extends BaseImporter<BackupCampana, any> {
  constructor(prisma: PrismaClient, logger: ILogger) {
    super(prisma, logger, new BaseValidator<BackupCampana>());
  }

  getName(): string {
    return 'Campañas';
  }

  protected async importSingle(data: BackupCampana): Promise<any> {
    // Verificar si ya existe una campaña con el mismo nombre
    const existingCampana = await this.prisma.campana.findFirst({
      where: { nombre: data.nombre }
    });

    const campanaData = {
      nombre: data.nombre,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
      presupuesto: data.presupuesto || 0,
      ingresoTotal: data.ingresoTotalReal || 0,
      gastoTotal: data.gastoTotalReal || 0,
      utilidad: data.rentabilidadReal || 0
    };

    if (existingCampana) {
      // Actualizar campaña existente
      return await this.prisma.campana.update({
        where: { id: existingCampana.id },
        data: campanaData
      });
    } else {
      // Crear nueva campaña
      return await this.prisma.campana.create({
        data: campanaData
      });
    }
  }
}

class TipoTransaccionImporter extends BaseImporter<string, any> {
  constructor(prisma: PrismaClient, logger: ILogger) {
    super(prisma, logger, new BaseValidator<string>());
  }

  getName(): string {
    return 'Tipos de Transacción';
  }

  protected async importSingle(tipo: string): Promise<any> {
    const dbType = TipoTransaccionMapper.mapToDbType(tipo);
    return await this.prisma.tipoTransaccion.upsert({
      where: { nombre: dbType },
      update: {},
      create: {
        nombre: dbType,
        descripcion: `Tipo ${tipo} importado automáticamente`
      }
    });
  }
}

class TransaccionImporter extends BaseImporter<BackupTransaccion, any> {
  private categoryMapper: CategoryMapper;
  private tipoCache = new Map<string, number>();
  private personaIdMapping = new Map<number, number>(); // Mapeo de IDs del backup a IDs de la nueva DB

  constructor(prisma: PrismaClient, logger: ILogger, categoryMapper: CategoryMapper) {
    super(prisma, logger, new TransaccionValidator());
    this.categoryMapper = categoryMapper;
  }

  getName(): string {
    return 'Transacciones';
  }

  async initialize(): Promise<void> {
    // Cargar tipos de transacción
    const tipos = await this.prisma.tipoTransaccion.findMany();
    this.logger.info(`🔍 DEBUG: Cargando ${tipos.length} tipos de transacción existentes:`);
    tipos.forEach(tipo => {
      this.tipoCache.set(tipo.nombre, tipo.id);
      this.logger.info(`  - ${tipo.nombre} (ID: ${tipo.id})`);
    });
    this.logger.info(`📋 DEBUG: Cache de tipos cargado: ${Array.from(this.tipoCache.entries()).map(([k,v]) => `${k}=${v}`).join(', ')}`);

    // Cargar personas y crear mapeo
    const personas = await this.prisma.persona.findMany();
    this.logger.info(`👥 DEBUG: Cargando ${personas.length} personas existentes:`);
    personas.forEach(persona => {
      this.logger.info(`  - ${persona.nombre} (ID: ${persona.id})`);
    });

    // Crear mapeo de IDs del backup a IDs de la nueva DB
    // Basado en el análisis del backup, mapear los IDs conocidos
    this.personaIdMapping.set(9, 1); // personaId 9 del backup -> Andrés Salamanca (ID 1)
    this.personaIdMapping.set(4, 1); // personaId 4 del backup -> Andrés Salamanca (ID 1)
    this.personaIdMapping.set(7, 1); // personaId 7 del backup -> Andrés Salamanca (ID 1)

    this.logger.info(`🔄 DEBUG: Mapeo de IDs de personas creado: ${Array.from(this.personaIdMapping.entries()).map(([k,v]) => `${k}->${v}`).join(', ')}`);
  }

  protected async importSingle(data: BackupTransaccion): Promise<any> {
    this.logger.info(`🔍 DEBUG: Procesando transacción: ${data.concepto} (${data.tipo}) - $${data.monto}`);

    // DEBUG: Mapeo de tipo
    const dbType = TipoTransaccionMapper.mapToDbType(data.tipo);
    this.logger.info(`  🔄 DEBUG: Tipo original: "${data.tipo}" -> Tipo DB: "${dbType}"`);

    const tipoId = this.tipoCache.get(dbType);
    this.logger.info(`  🔍 DEBUG: Buscando tipoId para "${dbType}" en cache: ${tipoId || 'NO ENCONTRADO'}`);

    if (!tipoId) {
      this.logger.error(`❌ ERROR: Tipo de transacción '${dbType}' no encontrado en cache`);
      this.logger.error(`  📋 DEBUG: Cache actual: ${Array.from(this.tipoCache.entries()).map(([k,v]) => `${k}=${v}`).join(', ')}`);
      throw new Error(`Tipo de transacción '${dbType}' no encontrado`);
    }

    this.logger.info(`  ✅ DEBUG: Tipo asignado correctamente: ${dbType} (ID: ${tipoId})`);

    // DEBUG: Verificación de persona
    let personaId: number | null = null;
    this.logger.info(`  👤 DEBUG: Verificando personaId: ${data.personaId || 'NO ASIGNADA'}`);

    if (data.personaId) {
      this.logger.info(`  🔍 DEBUG: Buscando persona con ID: ${data.personaId}`);

      // Primero intentar usar el mapeo
      if (this.personaIdMapping.has(data.personaId)) {
        const mappedId = this.personaIdMapping.get(data.personaId)!;
        this.logger.info(`  🔄 DEBUG: Usando mapeo: ${data.personaId} -> ${mappedId}`);

        const persona = await this.prisma.persona.findUnique({
          where: { id: mappedId }
        });

        if (persona) {
          personaId = persona.id;
          this.logger.info(`  ✅ DEBUG: Persona encontrada por mapeo: ${persona.nombre} (ID: ${personaId})`);
        } else {
          this.logger.warn(`  ⚠️ DEBUG: Persona mapeada ${mappedId} no encontrada, buscando fallback...`);
        }
      } else {
        this.logger.info(`  🔍 DEBUG: No hay mapeo para personaId ${data.personaId}, buscando directamente...`);
      }

      // Si no se encontró por mapeo, buscar directamente
      if (!personaId) {
        const persona = await this.prisma.persona.findUnique({
          where: { id: data.personaId }
        });

        if (!persona) {
          this.logger.warn(`  ⚠️ DEBUG: Persona ID ${data.personaId} no encontrada, buscando fallback...`);

          // Buscar por la primera persona disponible como fallback
          const primeraPersona = await this.prisma.persona.findFirst();
          if (primeraPersona) {
            personaId = primeraPersona.id;
            this.logger.warn(`  🔄 DEBUG: Usando fallback: ${primeraPersona.nombre} (ID: ${personaId})`);
          } else {
            this.logger.warn(`  ❌ DEBUG: No hay personas en la base de datos, transacción sin persona asignada`);
          }
        } else {
          personaId = persona.id;
          this.logger.info(`  ✅ DEBUG: Persona encontrada directamente: ${persona.nombre} (ID: ${personaId})`);
        }
      }
    } else {
      this.logger.info(`  ℹ️ DEBUG: Transacción sin personaId asignado`);
    }

    // DEBUG: Verificación de campaña
    let campanaId: number | null = null;
    this.logger.info(`  🎯 DEBUG: Verificando campanaId: ${data.campanaId || 'NO ASIGNADA'}`);

    if (data.campanaId) {
      this.logger.info(`  🔍 DEBUG: Buscando campaña con ID: ${data.campanaId}`);
      const campana = await this.prisma.campana.findUnique({
        where: { id: data.campanaId }
      });

      if (!campana) {
        this.logger.warn(`  ⚠️ DEBUG: Campaña ID ${data.campanaId} no encontrada, transacción sin campaña asignada`);
      } else {
        campanaId = campana.id;
        this.logger.info(`  ✅ DEBUG: Campaña encontrada: ${campana.nombre} (ID: ${campanaId})`);
      }
    } else {
      this.logger.info(`  ℹ️ DEBUG: Transacción sin campanaId asignado`);
    }

    // DEBUG: Verificación de categoría
    this.logger.info(`  📂 DEBUG: Verificando categoría: "${data.categoria || 'SIN CATEGORÍA'}"`);
    const categoriaId = await this.categoryMapper.getCategoryId(data.categoria);
    this.logger.info(`  ✅ DEBUG: Categoría asignada: ${categoriaId || 'SIN CATEGORÍA'}`);

    // DEBUG: Datos finales para crear
    const transaccionData = {
      tipoId,
      monto: data.monto,
      concepto: data.concepto,
      fecha: new Date(data.fecha),
      categoriaId,
      personaId,
      campanaId,
      moneda: data.moneda || 'COP',
      notas: data.notas || '',
      aprobado: true
    };

    this.logger.info(`  📝 DEBUG: Datos finales de transacción:`);
    this.logger.info(`    - tipoId: ${transaccionData.tipoId}`);
    this.logger.info(`    - monto: ${transaccionData.monto}`);
    this.logger.info(`    - concepto: ${transaccionData.concepto}`);
    this.logger.info(`    - fecha: ${transaccionData.fecha}`);
    this.logger.info(`    - categoriaId: ${transaccionData.categoriaId}`);
    this.logger.info(`    - personaId: ${transaccionData.personaId}`);
    this.logger.info(`    - campanaId: ${transaccionData.campanaId}`);
    this.logger.info(`    - moneda: ${transaccionData.moneda}`);
    this.logger.info(`    - aprobado: ${transaccionData.aprobado}`);

    try {
      const result = await this.prisma.transaccion.create({
        data: transaccionData
      });

      this.logger.info(`  ✅ DEBUG: Transacción creada exitosamente con ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`  ❌ ERROR: Fallo al crear transacción:`, error);
      throw error;
    }
  }
}

// ========================= MAIN IMPORTER SERVICE =========================

class DataImportService {
  private prisma: PrismaClient;
  private logger: ILogger;
  private categoryMapper: CategoryMapper;

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new ConsoleLogger();
    this.categoryMapper = new CategoryMapper(this.prisma, this.logger);
  }

  async importFromBackup(backupFilePath: string): Promise<void> {
    try {
      this.logger.info('🚀 Iniciando importación de datos...');

      // Leer archivo de backup
      const backupData = await this.loadBackupFile(backupFilePath);

      // Inicializar mappers
      await this.categoryMapper.initialize();

      // Ejecutar importación en orden correcto (respetando dependencias)
      await this.executeImportPipeline(backupData);

      this.logger.success('🎉 Importación completada exitosamente!');

    } catch (error) {
      this.logger.error('💥 Error durante la importación', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async loadBackupFile(filePath: string): Promise<BackupData> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo de backup no encontrado: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const backupData: BackupData = JSON.parse(fileContent);

    this.logger.info(`📁 Backup cargado: ${backupData.exportDate} (v${backupData.version})`);
    return backupData;
  }

  private async executeImportPipeline(backupData: BackupData): Promise<void> {
    const { data } = backupData;

    this.logger.info(`📊 DEBUG: Análisis de datos del backup:`);
    this.logger.info(`  - Roles: ${data.rolesData.length}`);
    this.logger.info(`  - Personas: ${data.personasData.length}`);
    this.logger.info(`  - Campañas: ${data.campanasData.length}`);
    this.logger.info(`  - Transacciones: ${data.transaccionesData.length}`);
    this.logger.info(`  - Categorías: ${data.categoriasData.length}`);

    // DEBUG: Mostrar tipos únicos de transacciones
    const tiposUnicos = [...new Set(data.transaccionesData.map(t => t.tipo))];
    this.logger.info(`  🔍 DEBUG: Tipos únicos de transacciones encontrados: ${tiposUnicos.join(', ')}`);

    // DEBUG: Mostrar algunas transacciones de ejemplo
    this.logger.info(`  📋 DEBUG: Ejemplos de transacciones:`);
    data.transaccionesData.slice(0, 5).forEach((t, i) => {
      this.logger.info(`    ${i+1}. ${t.concepto} - ${t.tipo} - $${t.monto} - Persona: ${t.personaId || 'N/A'} - Campaña: ${t.campanaId || 'N/A'} - Categoría: ${t.categoria || 'N/A'}`);
    });

    // DEBUG: Mostrar personas disponibles
    this.logger.info(`  👥 DEBUG: Personas disponibles en backup:`);
    data.personasData.forEach(p => {
      this.logger.info(`    - ID: ${p.id} - Nombre: ${p.nombre} - Rol: ${p.rolId}`);
    });

    // 1. Roles (no tienen dependencias)
    this.logger.info(`\n🔄 DEBUG: Iniciando importación de roles...`);
    const rolImporter = new RolImporter(this.prisma, this.logger);
    await rolImporter.import(data.rolesData);

    // 2. Personas (dependen de roles)
    this.logger.info(`\n🔄 DEBUG: Iniciando importación de personas...`);
    const personaImporter = new PersonaImporter(this.prisma, this.logger);
    await personaImporter.import(data.personasData);

    // 3. Campañas (no tienen dependencias)
    this.logger.info(`\n🔄 DEBUG: Iniciando importación de campañas...`);
    const campanaImporter = new CampanaImporter(this.prisma, this.logger);
    await campanaImporter.import(data.campanasData);

    // 4. Tipos de transacción (extraer tipos únicos)
    this.logger.info(`\n🔄 DEBUG: Iniciando importación de tipos de transacción...`);
    this.logger.info(`  📋 DEBUG: Tipos a importar: ${tiposUnicos.join(', ')}`);
    const tipoImporter = new TipoTransaccionImporter(this.prisma, this.logger);
    await tipoImporter.import(tiposUnicos);

    // 5. Transacciones (dependen de tipos, categorías, personas, campañas)
    this.logger.info(`\n🔄 DEBUG: Iniciando importación de transacciones...`);
    this.logger.info(`  📊 DEBUG: Total de transacciones a procesar: ${data.transaccionesData.length}`);

    const transaccionImporter = new TransaccionImporter(this.prisma, this.logger, this.categoryMapper);
    await transaccionImporter.initialize();
    await transaccionImporter.import(data.transaccionesData);

    // 6. Valor Hora (depende de personas y roles)
    // 7. Registro Horas (depende de personas y campañas)
    // 8. Distribución de Utilidades
    // ... otros importadores según necesidad
  }
}

// ========================= SCRIPT EXECUTION =========================

async function main() {
  const backupPath = process.argv[2] || './backup_2025-07-15.json';

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Archivo no encontrado: ${backupPath}`);
    console.log('💡 Uso: npm run import-data <ruta-del-backup>');
    process.exit(1);
  }

  const importer = new DataImportService();

  try {
    await importer.importFromBackup(backupPath);
    process.exit(0);
  } catch (error) {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { DataImportService };
