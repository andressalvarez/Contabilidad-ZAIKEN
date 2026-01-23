-- Agregar propietario (usuarioId) a tablas clave y backfill al usuario 1

-- Crear la columna si no existe
ALTER TABLE "personas" ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER;
ALTER TABLE "categorias" ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER;
ALTER TABLE "campanas" ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER;
ALTER TABLE "transacciones" ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER;

-- Agregar FK hacia usuarios
DO $$ BEGIN
  ALTER TABLE "personas" ADD CONSTRAINT "personas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "categorias" ADD CONSTRAINT "categorias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "campanas" ADD CONSTRAINT "campanas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill: asegurar que exista el usuario 1 (Super Admin)
INSERT INTO "usuarios" ("id", "email", "password", "nombre", "rol", "activo", "createdAt", "updatedAt")
VALUES (1, 'contacto@zaiken.com.co', '$2b$10$1RJuTF7b089gTG.1owFCMOgEcviUhQ8Li2yA56CT3MmYy.Uh.vNLq', 'Super Admin', 'ADMIN', true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Establecer usuarioId=1 en registros existentes que aún no tengan dueño
UPDATE "personas" SET "usuarioId" = 1 WHERE "usuarioId" IS NULL;
UPDATE "categorias" SET "usuarioId" = 1 WHERE "usuarioId" IS NULL;
UPDATE "campanas" SET "usuarioId" = 1 WHERE "usuarioId" IS NULL;
UPDATE "transacciones" SET "usuarioId" = 1 WHERE "usuarioId" IS NULL;



