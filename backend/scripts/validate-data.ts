// @ts-nocheck
// NOTA: Script legacy - requiere actualización para multi-tenant
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DataSnapshot {
  timestamp: string;
  counts: Record<string, number>;
  validation: {
    usuariosSinPersona: number;
    personasSinRol: number;
    transaccionesSinCategoria: number;
    transaccionesSinTipo: number;
    registroHorasSinPersona: number;
  };
  samples: {
    usuarios: any[];
    personas: any[];
    transacciones: any[];
  };
}

async function validateData(): Promise<DataSnapshot> {
  console.log('🔍 Validando integridad de datos...\n');

  // ========================================
  // 1. CONTEO DE REGISTROS
  // ========================================
  console.log('📊 Contando registros...');
  const counts = {
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

  console.log('\n📊 Conteo de registros:');
  Object.entries(counts).forEach(([table, count]) => {
    const emoji = count > 0 ? '✅' : '⚠️';
    console.log(`  ${emoji} ${table}: ${count}`);
  });

  // ========================================
  // 2. VALIDACIÓN DE RELACIONES
  // ========================================
  console.log('\n🔗 Validando relaciones...');

  // Usuarios sin persona
  const usuariosSinPersona = await prisma.usuario.count({
    where: { personas: { none: {} } },
  });

  // Personas sin rol
  const personasSinRol = await prisma.persona.count({
    where: { rolId: { equals: null } },
  });

  // Transacciones sin categoría
  const transaccionesSinCategoria = await prisma.transaccion.count({
    where: { categoriaId: { equals: null } },
  });

  // Transacciones sin tipo
  const transaccionesSinTipo = await prisma.transaccion.count({
    where: { tipoId: { equals: null } },
  });

  // Registro de horas sin persona
  const registroHorasSinPersona = await prisma.registroHoras.count({
    where: { personaId: { equals: null } },
  });

  console.log('\n🔗 Validación de relaciones:');
  console.log(`  Usuarios sin persona: ${usuariosSinPersona}`);
  console.log(`  Personas sin rol: ${personasSinRol}`);
  console.log(`  Transacciones sin categoría: ${transaccionesSinCategoria}`);
  console.log(`  Transacciones sin tipo: ${transaccionesSinTipo}`);
  console.log(`  Registro horas sin persona: ${registroHorasSinPersona}`);

  // ========================================
  // 3. MUESTRAS DE DATOS
  // ========================================
  console.log('\n📋 Obteniendo muestras de datos...');

  const usuarios = await prisma.usuario.findMany({
    take: 5,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      createdAt: true,
    },
  });

  const personas = await prisma.persona.findMany({
    take: 5,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nombre: true,
      rolId: true,
      usuarioId: true,
      participacionPorc: true,
    },
  });

  const transacciones = await prisma.transaccion.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    select: {
      id: true,
      fecha: true,
      concepto: true,
      monto: true,
      tipoId: true,
      categoriaId: true,
      personaId: true,
      campanaId: true,
    },
  });

  // ========================================
  // 4. CREAR SNAPSHOT
  // ========================================
  const snapshot: DataSnapshot = {
    timestamp: new Date().toISOString(),
    counts,
    validation: {
      usuariosSinPersona,
      personasSinRol,
      transaccionesSinCategoria,
      transaccionesSinTipo,
      registroHorasSinPersona,
    },
    samples: {
      usuarios,
      personas,
      transacciones,
    },
  };

  // Guardar snapshot
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const snapshotFile = path.join(backupDir, `snapshot_${Date.now()}.json`);
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));

  console.log('\n✅ Snapshot guardado:', snapshotFile);

  // ========================================
  // 5. RESUMEN
  // ========================================
  console.log('\n📊 RESUMEN DE VALIDACIÓN:');
  console.log(`  Total de registros: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
  console.log(`  Total de tablas: ${Object.keys(counts).length}`);
  console.log(`  Snapshot guardado: ${snapshotFile}`);

  const hasProblems =
    personasSinRol > 0 ||
    transaccionesSinTipo > 0 ||
    registroHorasSinPersona > 0;

  if (hasProblems) {
    console.log('\n⚠️  SE ENCONTRARON PROBLEMAS DE INTEGRIDAD');
    console.log('   Revisa los valores arriba antes de migrar');
  } else {
    console.log('\n✅ TODOS LOS DATOS ESTÁN ÍNTEGROS');
  }

  return snapshot;
}

// Ejecutar validación
validateData()
  .then((snapshot) => {
    console.log('\n✅ Validación completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ ERROR en validación:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
