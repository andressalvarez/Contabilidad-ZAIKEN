// @ts-nocheck
// NOTA: Script legacy - requiere actualización para multi-tenant
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

async function checkDatabaseConnection() {
  console.log('🔍 Verificando conexión a base de datos...');
  try {
    await prisma.$connect();
    results.push({
      name: 'Database Connection',
      passed: true,
      message: 'Conexión exitosa a la base de datos',
      critical: true,
    });
  } catch (error) {
    results.push({
      name: 'Database Connection',
      passed: false,
      message: `Error de conexión: ${error.message}`,
      critical: true,
    });
  }
}

async function checkMigrationFiles() {
  console.log('🔍 Verificando archivos de migración...');
  const migrationPath = path.join(__dirname, '../prisma/migrations/20260203000001_add_multi_tenant');

  if (fs.existsSync(migrationPath)) {
    const sqlFile = path.join(migrationPath, 'migration.sql');
    if (fs.existsSync(sqlFile)) {
      results.push({
        name: 'Migration Files',
        passed: true,
        message: 'Archivos de migración encontrados',
        critical: true,
      });
    } else {
      results.push({
        name: 'Migration Files',
        passed: false,
        message: 'Archivo migration.sql no encontrado',
        critical: true,
      });
    }
  } else {
    results.push({
      name: 'Migration Files',
      passed: false,
      message: 'Directorio de migración no encontrado',
      critical: true,
    });
  }
}

async function checkDependencies() {
  console.log('🔍 Verificando dependencias instaladas...');
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
  );

  const requiredDeps = ['@casl/ability', '@casl/prisma', '@prisma/client', '@nestjs/jwt'];
  const missingDeps: string[] = [];

  for (const dep of requiredDeps) {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  }

  if (missingDeps.length === 0) {
    results.push({
      name: 'Dependencies',
      passed: true,
      message: 'Todas las dependencias requeridas están instaladas',
      critical: true,
    });
  } else {
    results.push({
      name: 'Dependencies',
      passed: false,
      message: `Dependencias faltantes: ${missingDeps.join(', ')}`,
      critical: true,
    });
  }
}

async function checkModules() {
  console.log('🔍 Verificando módulos creados...');
  const caslModulePath = path.join(__dirname, '../src/casl/casl.module.ts');

  if (fs.existsSync(caslModulePath)) {
    results.push({
      name: 'CASL Module',
      passed: true,
      message: 'Módulo CASL encontrado',
      critical: false,
    });
  } else {
    results.push({
      name: 'CASL Module',
      passed: false,
      message: 'Módulo CASL no encontrado',
      critical: false,
    });
  }
}

async function checkBackupExists() {
  console.log('🔍 Verificando backups...');
  const backupPath = path.join(__dirname, '../backups');

  if (fs.existsSync(backupPath)) {
    const files = fs.readdirSync(backupPath);
    const sqlBackups = files.filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'));

    if (sqlBackups.length > 0) {
      results.push({
        name: 'Backups',
        passed: true,
        message: `${sqlBackups.length} backup(s) encontrado(s)`,
        critical: false,
      });
    } else {
      results.push({
        name: 'Backups',
        passed: false,
        message: 'No se encontraron backups. Ejecuta "npm run backup" antes de migrar',
        critical: true,
      });
    }
  } else {
    results.push({
      name: 'Backups',
      passed: false,
      message: 'Directorio de backups no existe. Ejecuta "npm run backup"',
      critical: true,
    });
  }
}

async function checkExistingData() {
  console.log('🔍 Verificando datos existentes...');
  try {
    const usuarios = await prisma.usuario.count();
    const transacciones = await prisma.transaccion.count();
    const campanas = await prisma.campana.count();

    results.push({
      name: 'Existing Data',
      passed: true,
      message: `Datos encontrados - Usuarios: ${usuarios}, Transacciones: ${transacciones}, Campañas: ${campanas}`,
      critical: false,
    });
  } catch (error) {
    results.push({
      name: 'Existing Data',
      passed: false,
      message: `Error al verificar datos: ${error.message}`,
      critical: false,
    });
  }
}

async function printResults() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESULTADOS DE VALIDACIÓN PRE-DEPLOY');
  console.log('='.repeat(70) + '\n');

  let criticalFailures = 0;
  let warnings = 0;

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    const severity = result.critical ? '[CRÍTICO]' : '[ADVERTENCIA]';
    const status = result.passed ? '' : severity;

    console.log(`${icon} ${result.name} ${status}`);
    console.log(`   ${result.message}\n`);

    if (!result.passed) {
      if (result.critical) {
        criticalFailures++;
      } else {
        warnings++;
      }
    }
  }

  console.log('='.repeat(70));
  console.log(`\n📈 Resumen:`);
  console.log(`   Total de verificaciones: ${results.length}`);
  console.log(`   Exitosas: ${results.filter(r => r.passed).length}`);
  console.log(`   Fallas críticas: ${criticalFailures}`);
  console.log(`   Advertencias: ${warnings}\n`);

  if (criticalFailures > 0) {
    console.log('❌ NO PROCEDER CON EL DEPLOY');
    console.log('   Resuelve las fallas críticas antes de continuar.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  PUEDES PROCEDER PERO CON PRECAUCIÓN');
    console.log('   Hay advertencias que deberías revisar.\n');
    process.exit(0);
  } else {
    console.log('✅ LISTO PARA DEPLOY');
    console.log('   Todos los checks pasaron exitosamente.\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. npm run backup (si no lo has hecho)');
    console.log('   2. npx prisma migrate deploy');
    console.log('   3. npm run validate:migration');
    console.log('   4. npm run start:prod\n');
    process.exit(0);
  }
}

async function main() {
  console.log('🚀 Iniciando validación pre-deploy...\n');

  await checkDatabaseConnection();
  await checkMigrationFiles();
  await checkDependencies();
  await checkModules();
  await checkBackupExists();
  await checkExistingData();

  await printResults();
}

main()
  .catch((error) => {
    console.error('❌ Error durante la validación:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
