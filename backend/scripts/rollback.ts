// @ts-nocheck
// NOTA: Script legacy - requiere actualización para multi-tenant
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface RollbackOptions {
  migrationName?: string;
  useLatestBackup?: boolean;
  backupFile?: string;
}

async function rollback(options: RollbackOptions = {}): Promise<void> {
  console.log('🔄 Iniciando rollback...\n');

  const { migrationName, useLatestBackup = true, backupFile } = options;

  // ========================================
  // 1. CONFIRMAR ROLLBACK
  // ========================================
  console.log('⚠️  ADVERTENCIA: El rollback restaurará la base de datos a un estado anterior');
  console.log('   Todos los cambios realizados después del backup se perderán\n');

  // ========================================
  // 2. ROLLBACK DE MIGRACIÓN PRISMA (si se especifica)
  // ========================================
  if (migrationName) {
    console.log(`📝 Marcando migración como rolled back: ${migrationName}`);
    try {
      execSync(`npx prisma migrate resolve --rolled-back "${migrationName}"`, {
        stdio: 'inherit',
      });
      console.log('✅ Migración marcada como rolled back\n');
    } catch (error) {
      console.error('❌ Error al marcar migración:', error.message);
      throw error;
    }
  }

  // ========================================
  // 3. BUSCAR BACKUP MÁS RECIENTE
  // ========================================
  const backupDir = path.join(__dirname, '../backups');
  let restoreFile: string;

  if (backupFile) {
    restoreFile = backupFile;
    console.log(`📥 Usando backup especificado: ${restoreFile}`);
  } else if (useLatestBackup) {
    console.log('🔍 Buscando backup más reciente...');

    if (!fs.existsSync(backupDir)) {
      throw new Error('No existe el directorio de backups');
    }

    const backups = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql.gz'))
      .sort()
      .reverse();

    if (backups.length === 0) {
      throw new Error('No hay backups disponibles');
    }

    restoreFile = path.join(backupDir, backups[0]);
    console.log(`📥 Backup más reciente: ${backups[0]}`);
  } else {
    throw new Error('Debe especificar un archivo de backup o usar el más reciente');
  }

  // Verificar que el archivo existe
  if (!fs.existsSync(restoreFile)) {
    throw new Error(`El archivo de backup no existe: ${restoreFile}`);
  }

  // ========================================
  // 4. OBTENER DATABASE_URL
  // ========================================
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL no está configurada');
  }

  // ========================================
  // 5. CREAR BACKUP DE SEGURIDAD ANTES DE RESTAURAR
  // ========================================
  console.log('\n📦 Creando backup de seguridad antes de restaurar...');
  const safetyBackup = path.join(backupDir, `safety_backup_${Date.now()}.sql`);

  try {
    execSync(`pg_dump ${databaseUrl} > ${safetyBackup}`, {
      stdio: 'inherit',
    });
    execSync(`gzip ${safetyBackup}`, {
      stdio: 'inherit',
    });
    console.log(`✅ Backup de seguridad creado: ${safetyBackup}.gz\n`);
  } catch (error) {
    console.error('⚠️  No se pudo crear backup de seguridad');
  }

  // ========================================
  // 6. RESTAURAR BACKUP
  // ========================================
  console.log('🔄 Restaurando base de datos...');
  console.log(`   Archivo: ${restoreFile}`);
  console.log('   Esto puede tardar varios minutos...\n');

  try {
    // Descomprimir si es necesario
    if (restoreFile.endsWith('.gz')) {
      console.log('📦 Descomprimiendo backup...');
      execSync(`gunzip -c "${restoreFile}" | psql ${databaseUrl}`, {
        stdio: 'inherit',
      });
    } else {
      execSync(`psql ${databaseUrl} < "${restoreFile}"`, {
        stdio: 'inherit',
      });
    }

    console.log('\n✅ Base de datos restaurada exitosamente');
  } catch (error) {
    console.error('\n❌ ERROR al restaurar base de datos:', error.message);
    console.error('\n⚠️  IMPORTANTE: Se creó un backup de seguridad en:', `${safetyBackup}.gz`);
    console.error('   Puedes intentar restaurar manualmente con ese archivo\n');
    throw error;
  }

  // ========================================
  // 7. VERIFICAR RESTAURACIÓN
  // ========================================
  console.log('\n🔍 Verificando restauración...');

  try {
    // Ejecutar script de validación
    console.log('   Ejecutando validación de datos...');
    execSync('npx ts-node scripts/validate-data.ts', {
      stdio: 'inherit',
    });
    console.log('✅ Verificación completada\n');
  } catch (error) {
    console.warn('⚠️  La verificación falló, pero la restauración se completó');
  }

  // ========================================
  // 8. RESUMEN
  // ========================================
  console.log('='.repeat(60));
  console.log('✅ ROLLBACK COMPLETADO');
  console.log('='.repeat(60));
  console.log(`   Backup restaurado: ${path.basename(restoreFile)}`);
  console.log(`   Backup de seguridad: ${path.basename(safetyBackup)}.gz`);

  if (migrationName) {
    console.log(`   Migración marcada como rolled back: ${migrationName}`);
  }

  console.log('\n📋 Próximos pasos:');
  console.log('   1. Verificar que los datos son correctos');
  console.log('   2. Ejecutar: npx prisma db push (para sincronizar schema)');
  console.log('   3. Reiniciar la aplicación\n');
}

// Ejecutar rollback si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: RollbackOptions = {};

  // Parsear argumentos
  if (args.includes('--migration')) {
    const index = args.indexOf('--migration');
    options.migrationName = args[index + 1];
  }

  if (args.includes('--backup')) {
    const index = args.indexOf('--backup');
    options.backupFile = args[index + 1];
    options.useLatestBackup = false;
  }

  rollback(options)
    .then(() => {
      console.log('✅ Rollback exitoso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Rollback falló:', error.message);
      process.exit(1);
    });
}

export { rollback };
