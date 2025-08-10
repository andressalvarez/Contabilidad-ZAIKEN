import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando migración de datos...');

  try {
    // Ruta al archivo de backup JSON
    const backupPath = path.join(__dirname, '..', '..', '..', 'backup_2025-07-15.json');

    if (!fs.existsSync(backupPath)) {
      console.log('ℹ️  No se encontró archivo de backup, creando datos de ejemplo...');
      await createSampleData();
      return;
    }

    // Leer datos del archivo JSON
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const data = backupData.data;

    console.log('📊 Datos encontrados en backup:', {
      roles: data.rolesData?.length || 0,
      personas: data.personasData?.length || 0,
      categorias: data.categoriasData?.length || 0,
      transacciones: data.transaccionesData?.length || 0,
    });

    // Limpiar datos existentes
    await prisma.distribucionDetalle.deleteMany();
    await prisma.distribucionUtilidades.deleteMany();
    await prisma.registroHoras.deleteMany();
    await prisma.valorHora.deleteMany();
    await prisma.transaccion.deleteMany();
    await prisma.persona.deleteMany();
    await prisma.campana.deleteMany();
    await prisma.categoria.deleteMany();
    await prisma.rol.deleteMany();

    // Migrar Roles
    if (data.rolesData && data.rolesData.length > 0) {
      console.log('👥 Migrando roles...');
      for (const rol of data.rolesData) {
        await prisma.rol.create({
          data: {
            id: rol.id,
            nombreRol: rol.nombreRol,
            importancia: rol.importancia || 0,
            descripcion: rol.descripcion || null,
          },
        });
      }
      console.log(`✅ ${data.rolesData.length} roles migrados`);
    }

    // Migrar Categorías
    if (data.categoriasData && data.categoriasData.length > 0) {
      console.log('📂 Migrando categorías...');
      for (const categoria of data.categoriasData) {
        await prisma.categoria.create({
          data: {
            id: categoria.id,
            nombre: categoria.nombre,
            descripcion: null,
            color: null,
            activo: true,
          },
        });
      }
      console.log(`✅ ${data.categoriasData.length} categorías migradas`);
    }

    // Migrar Personas
    if (data.personasData && data.personasData.length > 0) {
      console.log('👤 Migrando personas...');
      for (const persona of data.personasData) {
        await prisma.persona.create({
          data: {
            id: persona.id,
            nombre: persona.nombre,
            rolId: persona.rolId,
            horasTotales: persona.horasTotales || 0,
            aportesTotales: persona.aportesTotales || 0,
            valorHora: persona.valorHora || 0,
            inversionHoras: persona.inversionHoras || 0,
            inversionTotal: persona.inversionTotal || 0,
            participacionPorc: persona.participacionPorc || 0,
            notas: persona.notas || null,
            activo: true,
          },
        });
      }
      console.log(`✅ ${data.personasData.length} personas migradas`);
    }

    // Migrar Valor Hora
    if (data.valorHoraData && data.valorHoraData.length > 0) {
      console.log('💰 Migrando valores de hora...');
      for (const valorHora of data.valorHoraData) {
        await prisma.valorHora.create({
          data: {
            id: valorHora.id,
            personaId: valorHora.personaId,
            rolId: valorHora.rolId,
            valor: valorHora.valor || 0,
            notas: valorHora.notas || null,
            fechaInicio: new Date(),
            activo: true,
          },
        });
      }
      console.log(`✅ ${data.valorHoraData.length} valores de hora migrados`);
    }

    // Migrar Campañas
    if (data.campanasData && data.campanasData.length > 0) {
      console.log('📢 Migrando campañas...');
      for (const campana of data.campanasData) {
        await prisma.campana.create({
          data: {
            id: campana.id,
            nombre: campana.nombre,
            descripcion: campana.descripcion || null,
            fechaInicio: new Date(campana.fechaInicio || new Date()),
            fechaFin: campana.fechaFin ? new Date(campana.fechaFin) : null,
            presupuesto: campana.presupuesto || null,
            ingresoTotal: campana.ingresoTotal || 0,
            gastoTotal: campana.gastoTotal || 0,
            utilidad: campana.utilidad || 0,
            activo: true,
          },
        });
      }
      console.log(`✅ ${data.campanasData.length} campañas migradas`);
    }

    // Migrar Transacciones
    if (data.transaccionesData && data.transaccionesData.length > 0) {
      console.log('💳 Migrando transacciones...');
      for (const transaccion of data.transaccionesData) {
        // Determinar el tipoId basado en el tipo original
        let tipoId = 1; // INGRESO por defecto
        if (transaccion.tipo === 'gasto') {
          tipoId = 2; // GASTO
        } else if (transaccion.tipo === 'aporte') {
          tipoId = 3; // APORTE
        }

        await prisma.transaccion.create({
          data: {
            id: transaccion.id,
            tipoId: tipoId,
            monto: transaccion.monto || 0,
            concepto: transaccion.descripcion || 'Sin concepto',
            fecha: new Date(transaccion.fecha || new Date()),
            categoria: transaccion.categoria || null,
            personaId: transaccion.personaId || null,
            campanaId: transaccion.campanaId || null,
            aprobado: transaccion.aprobado || false,
          },
        });
      }
      console.log(`✅ ${data.transaccionesData.length} transacciones migradas`);
    }

    console.log('🎉 Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

async function createSampleData() {
  console.log('📝 Creando datos de ejemplo...');

  // Crear roles de ejemplo
  const roles = await Promise.all([
    prisma.rol.create({
      data: { nombreRol: 'CEO', importancia: 40, descripcion: 'Director Ejecutivo' },
    }),
    prisma.rol.create({
      data: { nombreRol: 'Coordinador', importancia: 30, descripcion: 'Coordinación general' },
    }),
    prisma.rol.create({
      data: { nombreRol: 'Diseñador', importancia: 20, descripcion: 'Diseño y creatividad' },
    }),
  ]);

  // Crear categorías de ejemplo
  const categorias = await Promise.all([
    prisma.categoria.create({
      data: { nombre: 'Publicidad Digital', color: '#3B82F6' },
    }),
    prisma.categoria.create({
      data: { nombre: 'Infraestructura', color: '#10B981' },
    }),
    prisma.categoria.create({
      data: { nombre: 'Operaciones', color: '#F59E0B' },
    }),
  ]);

  // Crear personas de ejemplo
  const personas = await Promise.all([
    prisma.persona.create({
      data: {
        nombre: 'Juan Pérez',
        rolId: roles[0].id,
        valorHora: 50000,
        participacionPorc: 40,
      },
    }),
    prisma.persona.create({
      data: {
        nombre: 'María García',
        rolId: roles[1].id,
        valorHora: 35000,
        participacionPorc: 35,
      },
    }),
  ]);

  console.log('✅ Datos de ejemplo creados exitosamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
