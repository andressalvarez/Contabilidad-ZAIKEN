-- Migration: Remove Persona Entity Completely
-- Date: 2026-02-07

BEGIN;

-- ============================================
-- PASO 1: Verificar que todos los usuarioId están poblados
-- ============================================

DO $$
DECLARE
  missing_count INT;
BEGIN
  SELECT COUNT(*) INTO missing_count FROM valor_horas WHERE "usuarioId" IS NULL;
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'valor_horas tiene % registros sin usuarioId', missing_count;
  END IF;

  SELECT COUNT(*) INTO missing_count FROM registro_horas WHERE "usuarioId" IS NULL;
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'registro_horas tiene % registros sin usuarioId', missing_count;
  END IF;

  SELECT COUNT(*) INTO missing_count FROM distribucion_detalles WHERE "usuarioId" IS NULL;
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'distribucion_detalles tiene % registros sin usuarioId', missing_count;
  END IF;

  RAISE NOTICE 'Verificación OK: Todos los registros tienen usuarioId';
END $$;

-- ============================================
-- PASO 2: Eliminar índices con personaId
-- ============================================

DROP INDEX IF EXISTS "registro_horas_negocioId_personaId_idx";
DROP INDEX IF EXISTS "registro_horas_personaId_fecha_aprobado_idx";
DROP INDEX IF EXISTS "valor_horas_personaId_idx";
DROP INDEX IF EXISTS "transacciones_personaId_idx";
DROP INDEX IF EXISTS "distribucion_detalles_personaId_idx";

-- ============================================
-- PASO 3: Eliminar foreign keys de personaId
-- ============================================

ALTER TABLE valor_horas DROP CONSTRAINT IF EXISTS "valor_horas_personaId_fkey";
ALTER TABLE registro_horas DROP CONSTRAINT IF EXISTS "registro_horas_personaId_fkey";
ALTER TABLE transacciones DROP CONSTRAINT IF EXISTS "transacciones_personaId_fkey";
ALTER TABLE distribucion_detalles DROP CONSTRAINT IF EXISTS "distribucion_detalles_personaId_fkey";

-- ============================================
-- PASO 4: Eliminar columnas personaId
-- ============================================

ALTER TABLE valor_horas DROP COLUMN IF EXISTS "personaId";
ALTER TABLE registro_horas DROP COLUMN IF EXISTS "personaId";
ALTER TABLE transacciones DROP COLUMN IF EXISTS "personaId";
ALTER TABLE distribucion_detalles DROP COLUMN IF EXISTS "personaId";

-- ============================================
-- PASO 5: Hacer usuarioId NOT NULL donde corresponde
-- ============================================

ALTER TABLE valor_horas ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE registro_horas ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE distribucion_detalles ALTER COLUMN "usuarioId" SET NOT NULL;

-- ============================================
-- PASO 6: Eliminar tabla personas
-- ============================================

DROP TABLE IF EXISTS personas;

-- ============================================
-- PASO 7: Verificación final
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personas') THEN
    RAISE EXCEPTION 'Error: La tabla personas todavía existe';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registro_horas' AND column_name = 'personaId') THEN
    RAISE EXCEPTION 'Error: La columna personaId todavía existe en registro_horas';
  END IF;

  RAISE NOTICE 'Migración completada: Persona eliminada del sistema';
END $$;

COMMIT;
