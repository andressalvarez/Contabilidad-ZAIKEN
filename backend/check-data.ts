import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndCreateData() {
  console.log('🔍 Verificando datos...');

  try {
    // Verificar tipos de transacción
    const tipos = await prisma.tipoTransaccion.findMany();
    console.log('Tipos de transacción encontrados:', tipos.length);

    if (tipos.length === 0) {
      console.log('Creando tipos de transacción...');
      await prisma.tipoTransaccion.createMany({
        data: [
          { nombre: 'INGRESO', descripcion: 'Ingresos del negocio', activo: true },
          { nombre: 'GASTO', descripcion: 'Gastos del negocio', activo: true },
          { nombre: 'APORTE', descripcion: 'Aportes de socios', activo: true }
        ]
      });
      console.log('✅ Tipos creados');
    }

    // Verificar categorías
    const categorias = await prisma.categoria.findMany();
    console.log('Categorías encontradas:', categorias.length);

    if (categorias.length === 0) {
      console.log('Creando categorías...');
      await prisma.categoria.createMany({
        data: [
          { nombre: 'Servicios', descripcion: 'Ingresos por servicios', color: '#10b981', activo: true },
          { nombre: 'Consultoría', descripcion: 'Ingresos por consultoría', color: '#3b82f6', activo: true },
          { nombre: 'Publicidad Digital', descripcion: 'Gastos en publicidad digital', color: '#ef4444', activo: true },
          { nombre: 'Software', descripcion: 'Gastos en software', color: '#f59e42', activo: true },
          { nombre: 'Marketing', descripcion: 'Gastos en marketing', color: '#8b5cf6', activo: true }
        ]
      });
      console.log('✅ Categorías creadas');
    }

    // Verificar transacciones
    const transacciones = await prisma.transaccion.findMany();
    console.log('Transacciones encontradas:', transacciones.length);

    if (transacciones.length === 0) {
      console.log('Creando transacciones de prueba...');

      const tiposCreados = await prisma.tipoTransaccion.findMany();
      const categoriasCreadas = await prisma.categoria.findMany();

      const tipoIngreso = tiposCreados.find(t => t.nombre === 'INGRESO');
      const tipoGasto = tiposCreados.find(t => t.nombre === 'GASTO');

      const catServicios = categoriasCreadas.find(c => c.nombre === 'Servicios');
      const catConsultoria = categoriasCreadas.find(c => c.nombre === 'Consultoría');
      const catPublicidad = categoriasCreadas.find(c => c.nombre === 'Publicidad Digital');
      const catSoftware = categoriasCreadas.find(c => c.nombre === 'Software');
      const catMarketing = categoriasCreadas.find(c => c.nombre === 'Marketing');

      if (tipoIngreso && tipoGasto && catServicios && catConsultoria && catPublicidad && catSoftware && catMarketing) {
        await prisma.transaccion.createMany({
          data: [
            { tipoId: tipoIngreso.id, monto: 500000, concepto: 'Venta de servicios', fecha: new Date(), categoriaId: catServicios.id, moneda: 'COP', aprobado: true },
            { tipoId: tipoIngreso.id, monto: 300000, concepto: 'Consultoría', fecha: new Date(), categoriaId: catConsultoria.id, moneda: 'COP', aprobado: true },
            { tipoId: tipoGasto.id, monto: 150000, concepto: 'Publicidad', fecha: new Date(), categoriaId: catPublicidad.id, moneda: 'COP', aprobado: true },
            { tipoId: tipoGasto.id, monto: 80000, concepto: 'Software', fecha: new Date(), categoriaId: catSoftware.id, moneda: 'COP', aprobado: true },
            { tipoId: tipoGasto.id, monto: 120000, concepto: 'Marketing', fecha: new Date(), categoriaId: catMarketing.id, moneda: 'COP', aprobado: true }
          ]
        });
        console.log('✅ Transacciones creadas');
      }
    }

    // Verificar estadísticas
    const stats = await prisma.transaccion.aggregate({
      _sum: {
        monto: true
      },
      _count: {
        id: true
      }
    });

    console.log('Estadísticas generales:', {
      totalTransacciones: stats._count.id,
      totalMonto: stats._sum.monto
    });

    console.log('🎉 Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndCreateData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
