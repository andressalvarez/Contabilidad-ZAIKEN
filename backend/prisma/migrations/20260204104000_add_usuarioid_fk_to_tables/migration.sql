-- Migration: Add usuarioId FK to tables that reference Persona
-- Date: 2026-02-04
-- Strategy: Add new usuarioId columns without removing personaId (compatibility)

BEGIN;

-- ============================================
-- TABLA 1: registro_horas
-- ============================================

ALTER TABLE registro_horas ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER;

-- Copiar datos de personaId → usuarioId usando join con personas
UPDATE registro_horas rh
SET "usuarioId" = p."usuarioId"
FROM personas p
WHERE rh."personaId" = p.id;

-- Verificar que todos tienen usuarioId
DO $$
DECLARE
  registros_sin_usuario INT;
BEGIN
  SELECT COUNT(*) INTO registros_sin_usuario
  FROM registro_horas
  WHERE "personaId" IS NOT NULL AND "usuarioId" IS NULL;

  IF registros_sin_usuario > 0 THEN
    RAISE WARNING '% registros de horas sin usuarioId', registros_sin_usuario;
  ELSE
    RAISE NOTICE 'registro_horas: Todos los registros tienen usuarioId';
  END IF;
END $$;

-- Agregar FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registro_horas_usuarioId_fkey'
  ) THEN
    ALTER TABLE registro_horas
    ADD CONSTRAINT "registro_horas_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índice
CREATE INDEX IF NOT EXISTS "registro_horas_usuarioId_idx" ON registro_horas("usuarioId");

-- ============================================
-- TABLA 2: transacciones
-- (Ya tiene usuarioId, solo asegurar consistencia)
-- ============================================

-- Actualizar transacciones que tienen personaId pero no usuarioId
UPDATE transacciones t
SET "usuarioId" = p."usuarioId"
FROM personas p
WHERE t."personaId" = p.id
  AND t."usuarioId" IS NULL;

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS "transacciones_usuarioId_idx" ON transacciones("usuarioId");

-- ============================================
-- TABLA 3: valor_horas
-- ============================================

ALTER TABLE valor_horas ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER;

-- Copiar datos
UPDATE valor_horas vh
SET "usuarioId" = p."usuarioId"
FROM personas p
WHERE vh."personaId" = p.id;

-- Verificar
DO $$
DECLARE
  registros_sin_usuario INT;
BEGIN
  SELECT COUNT(*) INTO registros_sin_usuario
  FROM valor_horas
  WHERE "personaId" IS NOT NULL AND "usuarioId" IS NULL;

  IF registros_sin_usuario > 0 THEN
    RAISE WARNING '% registros de valor_horas sin usuarioId', registros_sin_usuario;
  ELSE
    RAISE NOTICE 'valor_horas: Todos los registros tienen usuarioId';
  END IF;
END $$;

-- Agregar FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valor_horas_usuarioId_fkey'
  ) THEN
    ALTER TABLE valor_horas
    ADD CONSTRAINT "valor_horas_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índice
CREATE INDEX IF NOT EXISTS "valor_horas_usuarioId_idx" ON valor_horas("usuarioId");

-- ============================================
-- TABLA 4: distribucion_detalles
-- ============================================

ALTER TABLE distribucion_detalles ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER;

-- Copiar datos
UPDATE distribucion_detalles dd
SET "usuarioId" = p."usuarioId"
FROM personas p
WHERE dd."personaId" = p.id;

-- Verificar
DO $$
DECLARE
  registros_sin_usuario INT;
BEGIN
  SELECT COUNT(*) INTO registros_sin_usuario
  FROM distribucion_detalles
  WHERE "personaId" IS NOT NULL AND "usuarioId" IS NULL;

  IF registros_sin_usuario > 0 THEN
    RAISE WARNING '% registros de distribucion_detalles sin usuarioId', registros_sin_usuario;
  ELSE
    RAISE NOTICE 'distribucion_detalles: Todos los registros tienen usuarioId';
  END IF;
END $$;

-- Agregar FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'distribucion_detalles_usuarioId_fkey'
  ) THEN
    ALTER TABLE distribucion_detalles
    ADD CONSTRAINT "distribucion_detalles_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índice
CREATE INDEX IF NOT EXISTS "distribucion_detalles_usuarioId_idx" ON distribucion_detalles("usuarioId");

-- ============================================
-- RESUMEN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migración de FKs completada exitosamente';
  RAISE NOTICE 'Tablas actualizadas:';
  RAISE NOTICE '  - registro_horas';
  RAISE NOTICE '  - transacciones';
  RAISE NOTICE '  - valor_horas';
  RAISE NOTICE '  - distribucion_detalles';
  RAISE NOTICE 'IMPORTANTE: personaId columns still exist (compatibility)';
  RAISE NOTICE '===========================================';
END $$;

COMMIT;
