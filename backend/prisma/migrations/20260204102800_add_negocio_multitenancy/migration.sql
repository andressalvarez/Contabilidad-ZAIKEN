-- Migration: Add Negocio table and negocioId to all tables (Multi-Tenancy)
-- Date: 2026-02-04
-- IMPORTANT: This migration adds multi-tenant support to existing production data

BEGIN;

-- ============================================
-- PASO 1: Crear tabla negocios
-- ============================================

CREATE TABLE IF NOT EXISTS "negocios" (
  "id" SERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "configuracion" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PASO 2: Crear negocio por defecto (id=1)
-- ============================================

INSERT INTO negocios (id, nombre, descripcion, activo, "createdAt", "updatedAt")
VALUES (1, 'Zaiken', 'Negocio principal', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Asegurar que la secuencia esté correcta
SELECT setval('negocios_id_seq', COALESCE((SELECT MAX(id) FROM negocios), 1));

-- ============================================
-- PASO 3: Agregar negocioId a todas las tablas
-- ============================================

-- usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE usuarios SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE personas SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- valor_horas
ALTER TABLE valor_horas ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE valor_horas SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- registro_horas
ALTER TABLE registro_horas ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE registro_horas SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- categorias
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE categorias SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- campanas
ALTER TABLE campanas ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE campanas SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- transacciones
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE transacciones SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- distribucion_utilidades
ALTER TABLE distribucion_utilidades ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE distribucion_utilidades SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- vs_carpetas
ALTER TABLE vs_carpetas ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE vs_carpetas SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- vs_grupos
ALTER TABLE vs_grupos ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE vs_grupos SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- vs_configuraciones
ALTER TABLE vs_configuraciones ADD COLUMN IF NOT EXISTS "negocioId" INTEGER DEFAULT 1 NOT NULL;
UPDATE vs_configuraciones SET "negocioId" = 1 WHERE "negocioId" IS NULL;

-- ============================================
-- PASO 4: Agregar Foreign Keys a negocios
-- ============================================

DO $$
BEGIN
  -- usuarios -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_negocioId_fkey') THEN
    ALTER TABLE usuarios ADD CONSTRAINT "usuarios_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- personas -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'personas_negocioId_fkey') THEN
    ALTER TABLE personas ADD CONSTRAINT "personas_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- valor_horas -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valor_horas_negocioId_fkey') THEN
    ALTER TABLE valor_horas ADD CONSTRAINT "valor_horas_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- registro_horas -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registro_horas_negocioId_fkey') THEN
    ALTER TABLE registro_horas ADD CONSTRAINT "registro_horas_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- categorias -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categorias_negocioId_fkey') THEN
    ALTER TABLE categorias ADD CONSTRAINT "categorias_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- campanas -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campanas_negocioId_fkey') THEN
    ALTER TABLE campanas ADD CONSTRAINT "campanas_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- transacciones -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transacciones_negocioId_fkey') THEN
    ALTER TABLE transacciones ADD CONSTRAINT "transacciones_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- distribucion_utilidades -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'distribucion_utilidades_negocioId_fkey') THEN
    ALTER TABLE distribucion_utilidades ADD CONSTRAINT "distribucion_utilidades_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- vs_carpetas -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vs_carpetas_negocioId_fkey') THEN
    ALTER TABLE vs_carpetas ADD CONSTRAINT "vs_carpetas_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- vs_grupos -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vs_grupos_negocioId_fkey') THEN
    ALTER TABLE vs_grupos ADD CONSTRAINT "vs_grupos_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;

  -- vs_configuraciones -> negocios
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vs_configuraciones_negocioId_fkey') THEN
    ALTER TABLE vs_configuraciones ADD CONSTRAINT "vs_configuraciones_negocioId_fkey"
    FOREIGN KEY ("negocioId") REFERENCES negocios(id);
  END IF;
END $$;

-- ============================================
-- PASO 5: Crear índices para performance
-- ============================================

CREATE INDEX IF NOT EXISTS "usuarios_negocioId_idx" ON usuarios("negocioId");
CREATE INDEX IF NOT EXISTS "personas_negocioId_idx" ON personas("negocioId");
CREATE INDEX IF NOT EXISTS "valor_horas_negocioId_idx" ON valor_horas("negocioId");
CREATE INDEX IF NOT EXISTS "registro_horas_negocioId_idx" ON registro_horas("negocioId");
CREATE INDEX IF NOT EXISTS "categorias_negocioId_idx" ON categorias("negocioId");
CREATE INDEX IF NOT EXISTS "campanas_negocioId_idx" ON campanas("negocioId");
CREATE INDEX IF NOT EXISTS "transacciones_negocioId_idx" ON transacciones("negocioId");
CREATE INDEX IF NOT EXISTS "distribucion_utilidades_negocioId_idx" ON distribucion_utilidades("negocioId");
CREATE INDEX IF NOT EXISTS "vs_carpetas_negocioId_idx" ON vs_carpetas("negocioId");
CREATE INDEX IF NOT EXISTS "vs_grupos_negocioId_idx" ON vs_grupos("negocioId");
CREATE INDEX IF NOT EXISTS "vs_configuraciones_negocioId_idx" ON vs_configuraciones("negocioId");

-- ============================================
-- PASO 6: Verificar que todos tienen negocioId
-- ============================================

DO $$
DECLARE
  count_sin_negocio INT;
BEGIN
  SELECT COUNT(*) INTO count_sin_negocio FROM usuarios WHERE "negocioId" IS NULL;
  IF count_sin_negocio > 0 THEN
    RAISE EXCEPTION 'Error: % usuarios sin negocioId', count_sin_negocio;
  END IF;

  SELECT COUNT(*) INTO count_sin_negocio FROM personas WHERE "negocioId" IS NULL;
  IF count_sin_negocio > 0 THEN
    RAISE EXCEPTION 'Error: % personas sin negocioId', count_sin_negocio;
  END IF;

  RAISE NOTICE 'Multi-tenancy configurado correctamente. Todos los registros tienen negocioId = 1';
END $$;

COMMIT;
