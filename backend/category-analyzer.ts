// @ts-nocheck
// NOTA: Script legacy - requiere actualización para multi-tenant
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

interface CategoryAnalysis {
  total: number;
  existing: string[];
  newCategories: string[];
  withoutCategory: number;
  typeMapping: { [key: string]: string };
}

interface BackupTransaccion {
  id?: number;
  fecha: string;
  tipo: string;
  concepto: string;
  categoria?: string;
  monto: number;
  moneda?: string;
  personaId?: number;
  campanaId?: number;
  notas?: string;
}

interface BackupData {
  exportDate: string;
  version: string;
  data: {
    transaccionesData: BackupTransaccion[];
    categoriasData: any[];
  };
}

class CategoryAnalyzer {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async analyzeBackup(backupFilePath: string): Promise<void> {
    try {
      console.log('🔍 Analizando categorías del backup...\n');

      // Cargar backup
      if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Archivo no encontrado: ${backupFilePath}`);
      }

      const backupData: BackupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));

      // Obtener categorías existentes en DB
      const existingCategories = await this.prisma.categoria.findMany();
      const existingCategoryNames = new Set(existingCategories.map(c => c.nombre));

      // Analizar categorías en transacciones
      const analysis = this.performCategoryAnalysis(backupData.data.transaccionesData, existingCategoryNames);

      // Mostrar reporte
      this.printReport(analysis, backupData);

    } catch (error) {
      console.error('❌ Error durante el análisis:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private performCategoryAnalysis(transactions: BackupTransaccion[], existingCategories: Set<string>): CategoryAnalysis {
    const categoriesInBackup = new Set<string>();
    const typeFrequency = new Map<string, number>();
    let withoutCategory = 0;

    // Extraer todas las categorías y tipos
    transactions.forEach(t => {
      // Categorías
      if (t.categoria && t.categoria.trim()) {
        categoriesInBackup.add(t.categoria.trim());
      } else {
        withoutCategory++;
      }

      // Tipos
      const currentCount = typeFrequency.get(t.tipo) || 0;
      typeFrequency.set(t.tipo, currentCount + 1);
    });

    const allCategories = Array.from(categoriesInBackup);
    const existing = allCategories.filter(cat => existingCategories.has(cat));
    const newCategories = allCategories.filter(cat => !existingCategories.has(cat));

    // Mapeo de tipos
    const typeMapping: { [key: string]: string } = {};
    const TIPO_MAP = {
      'Gasto': 'GASTO',
      'Ingreso': 'INGRESO',
      'Aporte': 'APORTE'
    };

    Array.from(typeFrequency.keys()).forEach(tipo => {
      typeMapping[tipo] = TIPO_MAP[tipo as keyof typeof TIPO_MAP] || 'GASTO';
    });

    return {
      total: allCategories.length,
      existing,
      newCategories,
      withoutCategory,
      typeMapping
    };
  }

  private printReport(analysis: CategoryAnalysis, backupData: BackupData): void {
    console.log('📊 REPORTE DE ANÁLISIS DE CATEGORÍAS');
    console.log('='.repeat(50));
    console.log(`📅 Backup: ${backupData.exportDate} (v${backupData.version})`);
    console.log(`📝 Total transacciones: ${backupData.data.transaccionesData.length}`);
    console.log();

    // Resumen de categorías
    console.log('🏷️  RESUMEN DE CATEGORÍAS:');
    console.log('-'.repeat(30));
    console.log(`✅ Categorías existentes: ${analysis.existing.length}`);
    console.log(`➕ Categorías nuevas: ${analysis.newCategories.length}`);
    console.log(`❌ Sin categoría: ${analysis.withoutCategory} transacciones`);
    console.log(`📊 Total categorías únicas: ${analysis.total}`);
    console.log();

    // Categorías existentes
    if (analysis.existing.length > 0) {
      console.log('✅ CATEGORÍAS QUE YA EXISTEN:');
      console.log('-'.repeat(30));
      analysis.existing.forEach(cat => {
        console.log(`   • ${cat}`);
      });
      console.log();
    }

    // Nuevas categorías
    if (analysis.newCategories.length > 0) {
      console.log('➕ CATEGORÍAS QUE SE CREARÁN:');
      console.log('-'.repeat(30));
      analysis.newCategories.forEach(cat => {
        console.log(`   • ${cat}`);
      });
      console.log();
    }

    // Mapeo de tipos
    console.log('🔄 MAPEO DE TIPOS DE TRANSACCIÓN:');
    console.log('-'.repeat(30));
    Object.entries(analysis.typeMapping).forEach(([backup, db]) => {
      console.log(`   "${backup}" → "${db}"`);
    });
    console.log();

    // Recomendaciones
    console.log('💡 RECOMENDACIONES:');
    console.log('-'.repeat(30));

    if (analysis.newCategories.length > 0) {
      console.log(`   • Se crearán ${analysis.newCategories.length} nuevas categorías automáticamente`);
    }

    if (analysis.withoutCategory > 0) {
      console.log(`   • ${analysis.withoutCategory} transacciones quedarán sin categoría (categoriaId: null)`);
    }

    console.log('   • Todas las transacciones del backup se marcarán como aprobadas');
    console.log('   • Las fechas se convertirán automáticamente al formato DateTime');
    console.log();

    // Instrucciones
    console.log('🚀 PARA EJECUTAR LA IMPORTACIÓN:');
    console.log('-'.repeat(30));
    console.log('   npm run import:backup');
    console.log('   # o con archivo específico:');
    console.log('   npm run import:data <ruta-del-backup>');
    console.log();
  }
}

async function main() {
  const backupPath = process.argv[2] || './backup_2025-07-15.json';

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Archivo no encontrado: ${backupPath}`);
    console.log('💡 Uso: npm run analyze:categories <ruta-del-backup>');
    process.exit(1);
  }

  const analyzer = new CategoryAnalyzer();
  await analyzer.analyzeBackup(backupPath);
}

if (require.main === module) {
  main().catch(console.error);
}
