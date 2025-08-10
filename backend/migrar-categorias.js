// migrar-categorias.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Asegura que existe la categoría 'Sin categoría'
  let sinCategoria = await prisma.categoria.findFirst({ where: { nombre: 'Sin categoría' } });
  if (!sinCategoria) {
    sinCategoria = await prisma.categoria.create({ data: { nombre: 'Sin categoría' } });
  }

  // Trae todas las transacciones con categoriaId null y campo categoria antiguo
  const transacciones = await prisma.$queryRawUnsafe(`
    SELECT id, categoria FROM transacciones WHERE categoriaId IS NULL AND categoria IS NOT NULL
  `);

  for (const t of transacciones) {
    let cat = null;
    if (!t.categoria) {
      cat = sinCategoria;
    } else {
      cat = await prisma.categoria.findFirst({ where: { nombre: t.categoria } });
      if (!cat) {
        cat = await prisma.categoria.create({ data: { nombre: t.categoria } });
      }
    }
    await prisma.transaccion.update({
      where: { id: t.id },
      data: { categoriaId: cat.id }
    });
  }

  // Asigna 'Sin categoría' a las transacciones sin categoria y sin categoriaId
  await prisma.transaccion.updateMany({
    where: { categoriaId: null },
    data: { categoriaId: sinCategoria.id }
  });

  console.log('Migración de categorías completada');
}
main().finally(() => prisma.$disconnect());
