// @ts-nocheck
// NOTA: Script legacy - requiere actualización para multi-tenant
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  comparison?: {
    before: any;
    after: any;
    diff: any;
  };
}

async function validateMigration(): Promise<ValidationResult> {
  console.log('🔍 Validando migración multi-tenant...\n');

  const errors: string[] = [];
  const warnings: string[] = [];

  // ========================================
  // 1. VERIFICAR QUE EXISTE TABLA NEGOCIOS
  // ========================================
  console.log('📋 Verificando tabla Negocios...');
  try {
    const negociosCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM negocios`;
    const count = Number((negociosCount as any)[0].count);
    console.log(`  ✅ Tabla negocios existe con ${count} registros`);

    if (count === 0) {
      errors.push('La tabla negocios está vacía. Debe existir al menos un negocio.');
    }
  } catch (error) {
    errors.push('No se pudo encontrar la tabla negocios. Ejecuta la migración primero.');
  }

  // ========================================
  // 2. VERIFICAR negocioId EN TODAS LAS TABLAS
  // ========================================
  console.log('\n📋 Verificando negocioId en todas las tablas...');

  const tablesWithNegocio = [
    'usuarios',
    'personas',
    'roles',
    'categorias',
    'campanas',
    'transacciones',
    'registro_horas',
    'valor_horas',
    'distribucion_utilidades',
    'distribucion_detalles',
  ];

  for (const table of tablesWithNegocio) {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM "${table}"
        WHERE "negocioId" IS NULL
      `);

      const nullCount = Number((result as any)[0].count);

      if (nullCount > 0) {
        errors.push(`Tabla ${table} tiene ${nullCount} registros sin negocioId`);
        console.log(`  ❌ ${table}: ${nullCount} registros SIN negocioId`);
      } else {
        console.log(`  ✅ ${table}: Todos los registros tienen negocioId`);
      }
    } catch (error) {
      errors.push(`No se pudo verificar negocioId en tabla ${table}: ${error.message}`);
      console.log(`  ❌ ${table}: Error al verificar`);
    }
  }

  // ========================================
  // 3. COMPARAR CON SNAPSHOT ANTERIOR
  // ========================================
  console.log('\n📊 Comparando con snapshot anterior...');

  const backupDir = path.join(__dirname, '../backups');
  const snapshotFiles = fs.existsSync(backupDir)
    ? fs.readdirSync(backupDir)
        .filter(f => f.startsWith('snapshot_'))
        .sort()
        .reverse()
    : [];

  let comparison: any = null;

  if (snapshotFiles.length > 0) {
    const latestSnapshot = path.join(backupDir, snapshotFiles[0]);
    const beforeSnapshot = JSON.parse(fs.readFileSync(latestSnapshot, 'utf-8'));

    // Contar registros actuales
    const currentCounts = {
      usuarios: await prisma.usuario.count(),
      personas: await prisma.persona.count(),
      roles: await prisma.rol.count(),
      campanas: await prisma.campana.count(),
      categorias: await prisma.categoria.count(),
      transacciones: await prisma.transaccion.count(),
      registroHoras: await prisma.registroHoras.count(),
      tiposTransaccion: await prisma.tipoTransaccion.count(),
      valorHoras: await prisma.valorHora.count(),
      distribucionUtilidades: await prisma.distribucionUtilidades.count(),
      distribucionDetalles: await prisma.distribucionDetalle.count(),
    };

    console.log('\n📊 Comparación de conteos:');
    const diff: Record<string, number> = {};

    for (const [table, beforeCount] of Object.entries(beforeSnapshot.counts)) {
      const afterCount = currentCounts[table as keyof typeof currentCounts] || 0;
      const difference = afterCount - (beforeCount as number);
      diff[table] = difference;

      if (difference === 0) {
        console.log(`  ✅ ${table}: ${afterCount} (sin cambios)`);
      } else if (difference > 0) {
        console.log(`  ⚠️  ${table}: ${beforeCount} → ${afterCount} (+${difference})`);
        warnings.push(`Tabla ${table} tiene ${difference} registros adicionales`);
      } else {
        console.log(`  ❌ ${table}: ${beforeCount} → ${afterCount} (${difference})`);
        errors.push(`PÉRDIDA DE DATOS: Tabla ${table} perdió ${Math.abs(difference)} registros`);
      }
    }

    comparison = {
      before: beforeSnapshot.counts,
      after: currentCounts,
      diff,
    };
  } else {
    warnings.push('No hay snapshots previos para comparar');
    console.log('  ⚠️  No hay snapshots previos');
  }

  // ========================================
  // 4. VERIFICAR FOREIGN KEYS
  // ========================================
  console.log('\n🔗 Verificando foreign keys...');

  try {
    // Verificar que todos los negocioId referencien a negocios existentes
    for (const table of tablesWithNegocio) {
      const orphans = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM "${table}" t
        LEFT JOIN negocios n ON t."negocioId" = n.id
        WHERE t."negocioId" IS NOT NULL AND n.id IS NULL
      `);

      const orphanCount = Number((orphans as any)[0].count);

      if (orphanCount > 0) {
        errors.push(`Tabla ${table} tiene ${orphanCount} registros con negocioId inválido`);
        console.log(`  ❌ ${table}: ${orphanCount} registros huérfanos`);
      } else {
        console.log(`  ✅ ${table}: Foreign keys válidas`);
      }
    }
  } catch (error) {
    warnings.push(`No se pudieron verificar foreign keys: ${error.message}`);
  }

  // ========================================
  // 5. RESUMEN FINAL
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE VALIDACIÓN DE MIGRACIÓN');
  console.log('='.repeat(60));

  const success = errors.length === 0;

  if (success) {
    console.log('\n✅ MIGRACIÓN EXITOSA');
    console.log('   Todos los datos están íntegros');
    console.log('   No se perdió información');
  } else {
    console.log('\n❌ PROBLEMAS DETECTADOS');
    console.log(`   Errores: ${errors.length}`);
    console.log(`   Advertencias: ${warnings.length}`);
  }

  if (errors.length > 0) {
    console.log('\n🚨 ERRORES:');
    errors.forEach(err => console.log(`   - ${err}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS:');
    warnings.forEach(warn => console.log(`   - ${warn}`));
  }

  return {
    success,
    errors,
    warnings,
    comparison,
  };
}

// Ejecutar validación
validateMigration()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Validación completada exitosamente');
      process.exit(0);
    } else {
      console.log('\n❌ Validación falló');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ ERROR en validación:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
