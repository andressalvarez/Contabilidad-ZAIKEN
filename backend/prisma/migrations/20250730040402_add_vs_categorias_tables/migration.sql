-- CreateTable
CREATE TABLE "vs_carpetas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vs_carpetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vs_grupos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "carpetaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vs_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vs_grupo_categorias" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vs_grupo_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vs_configuraciones" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "configuracion" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vs_configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vs_grupo_categorias_grupoId_categoriaId_key" ON "vs_grupo_categorias"("grupoId", "categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "vs_configuraciones_nombre_key" ON "vs_configuraciones"("nombre");

-- AddForeignKey
ALTER TABLE "vs_grupos" ADD CONSTRAINT "vs_grupos_carpetaId_fkey" FOREIGN KEY ("carpetaId") REFERENCES "vs_carpetas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vs_grupo_categorias" ADD CONSTRAINT "vs_grupo_categorias_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "vs_grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vs_grupo_categorias" ADD CONSTRAINT "vs_grupo_categorias_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
