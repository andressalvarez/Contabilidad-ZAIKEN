-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombreRol" TEXT NOT NULL,
    "importancia" INTEGER NOT NULL DEFAULT 0,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "rolId" INTEGER NOT NULL,
    "horasTotales" INTEGER NOT NULL DEFAULT 0,
    "aportesTotales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorHora" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inversionHoras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inversionTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "participacionPorc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valor_horas" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "rolId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "notas" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valor_horas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_horas" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "campanaId" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horas" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registro_horas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "presupuesto" DOUBLE PRECISION,
    "ingresoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "utilidad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_transaccion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_transaccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones" (
    "id" SERIAL NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "concepto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "categoriaId" INTEGER,
    "personaId" INTEGER,
    "campanaId" INTEGER,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "notas" TEXT,
    "comprobante" TEXT,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribucion_utilidades" (
    "id" SERIAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilidadTotal" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribucion_utilidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribucion_detalles" (
    "id" SERIAL NOT NULL,
    "distribucionId" INTEGER NOT NULL,
    "personaId" INTEGER NOT NULL,
    "porcentajeParticipacion" DOUBLE PRECISION NOT NULL,
    "montoDistribuido" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribucion_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'USER',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombreRol_key" ON "roles"("nombreRol");

-- CreateIndex
CREATE UNIQUE INDEX "personas_nombre_key" ON "personas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_transaccion_nombre_key" ON "tipos_transaccion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valor_horas" ADD CONSTRAINT "valor_horas_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valor_horas" ADD CONSTRAINT "valor_horas_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_horas" ADD CONSTRAINT "registro_horas_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_horas" ADD CONSTRAINT "registro_horas_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "tipos_transaccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribucion_detalles" ADD CONSTRAINT "distribucion_detalles_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribucion_detalles" ADD CONSTRAINT "distribucion_detalles_distribucionId_fkey" FOREIGN KEY ("distribucionId") REFERENCES "distribucion_utilidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
