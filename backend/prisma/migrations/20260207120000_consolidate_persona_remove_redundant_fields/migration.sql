-- Migration: Consolidate Persona → Usuario - Remove Redundant Fields
-- Date: 2026-02-07
-- Purpose: Remove all redundant fields from Persona model (data already in Usuario)

BEGIN;

-- ============================================
-- PASO 0: Verificar que todos los campos están migrados a Usuario
-- ============================================

DO $$
DECLARE
  usuarios_sin_rolId INT;
  personas_sin_usuario INT;
BEGIN
  -- Verificar que no hay personas sin usuarioId
  SELECT COUNT(*) INTO personas_sin_usuario
  FROM personas WHERE "usuarioId" IS NULL;

  IF personas_sin_usuario > 0 THEN
    RAISE EXCEPTION 'Error: % personas sin usuarioId. Ejecutar migración de datos primero.', personas_sin_usuario;
  END IF;

  RAISE NOTICE 'Verificación OK: Todas las personas tienen usuarioId';
END $$;

-- ============================================
-- PASO 1: Asegurar que usuarioId tiene los datos en otras tablas
-- ============================================

-- ValorHora: Copiar personaId → usuarioId si falta
UPDATE valor_horas vh
SET "usuarioId" = p."usuarioId"
FROM personas p
WHERE vh."personaId" = p.id
  AND vh."usuarioId" IS NULL;

-- RegistroHoras: Copiar personaId → usuarioId si falta
UPDATE registro_horas rh
SET "usuarioId" = p."usuarioId"
FROM personas p
WHERE rh."personaId" = p.id
  AND rh."usuarioId" IS NULL;

-- DistribucionDetalle: Copiar personaId → usuarioId si falta
UPDATE distribucion_detalles dd
SET "usuarioId" = p."usuarioId"
FROM personas p
WHERE dd."personaId" = p.id
  AND dd."usuarioId" IS NULL;

-- Transacciones: Copiar personaId → usuarioId si falta
UPDATE transacciones t
SET "usuarioId" = p."usuarioId"
FROM personas p
WHERE t."personaId" = p.id
  AND t."usuarioId" IS NULL
  AND p."usuarioId" IS NOT NULL;

-- ============================================
-- PASO 2: Eliminar campos redundantes de personas
-- ============================================

-- Eliminar unique constraint que incluye nombre (ya no existirá)
ALTER TABLE personas DROP CONSTRAINT IF EXISTS "personas_negocioId_nombre_key";

-- Eliminar FK a roles (personas ya no tiene rolId propio)
ALTER TABLE personas DROP CONSTRAINT IF EXISTS "personas_rolId_fkey";

-- Eliminar columnas redundantes
ALTER TABLE personas DROP COLUMN IF EXISTS "nombre";
ALTER TABLE personas DROP COLUMN IF EXISTS "email";
ALTER TABLE personas DROP COLUMN IF EXISTS "rolId";
ALTER TABLE personas DROP COLUMN IF EXISTS "participacionPorc";
ALTER TABLE personas DROP COLUMN IF EXISTS "horasTotales";
ALTER TABLE personas DROP COLUMN IF EXISTS "aportesTotales";
ALTER TABLE personas DROP COLUMN IF EXISTS "valorHora";
ALTER TABLE personas DROP COLUMN IF EXISTS "inversionHoras";
ALTER TABLE personas DROP COLUMN IF EXISTS "inversionTotal";
ALTER TABLE personas DROP COLUMN IF EXISTS "notas";
ALTER TABLE personas DROP COLUMN IF EXISTS "activo";

-- ============================================
-- PASO 3: Hacer usuarioId obligatorio en personas
-- ============================================

ALTER TABLE personas ALTER COLUMN "usuarioId" SET NOT NULL;

-- Crear unique constraint para 1:1 con usuario
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'personas_usuarioId_key'
  ) THEN
    ALTER TABLE personas ADD CONSTRAINT "personas_usuarioId_key" UNIQUE ("usuarioId");
  END IF;
END $$;

-- ============================================
-- PASO 4: Verificar estructura final
-- ============================================

DO $$
DECLARE
  col_count INT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'personas' AND column_name IN (
    'nombre', 'email', 'rolId', 'participacionPorc', 'horasTotales',
    'aportesTotales', 'valorHora', 'inversionHoras', 'inversionTotal',
    'notas', 'activo'
  );

  IF col_count > 0 THEN
    RAISE EXCEPTION 'Error: Aún existen % columnas redundantes en personas', col_count;
  END IF;

  RAISE NOTICE 'Consolidación exitosa: Persona ahora solo tiene id, usuarioId, negocioId, timestamps';
END $$;

COMMIT;
