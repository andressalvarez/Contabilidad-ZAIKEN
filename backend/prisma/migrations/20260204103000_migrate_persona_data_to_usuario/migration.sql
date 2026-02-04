-- Migration: Copy Persona data to Usuario
-- Date: 2026-02-04

BEGIN;

-- ============================================
-- PASO 1: Actualizar usuarios que YA tienen persona vinculada
-- ============================================

UPDATE usuarios u
SET
  "rolId" = p."rolId",
  "participacionPorc" = p."participacionPorc",
  "horasTotales" = p."horasTotales",
  "aportesTotales" = p."aportesTotales",
  "valorHora" = p."valorHora",
  "inversionHoras" = p."inversionHoras",
  "inversionTotal" = p."inversionTotal",
  "notas" = p."notas"
FROM personas p
WHERE p."usuarioId" = u.id;

-- ============================================
-- PASO 2: Crear usuarios para personas SIN usuario vinculado
-- ============================================

INSERT INTO usuarios (
  "negocioId",
  "email",
  "password",
  "nombre",
  "rol",
  "activo",
  "rolId",
  "participacionPorc",
  "horasTotales",
  "aportesTotales",
  "valorHora",
  "inversionHoras",
  "inversionTotal",
  "notas",
  "createdAt",
  "updatedAt",
  "emailVerified"
)
SELECT
  p."negocioId",
  COALESCE(p."email", CONCAT('persona', p.id, '@temp.local')),
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- hash de "TempPassword123!"
  p."nombre",
  'EMPLEADO', -- Rol por defecto
  p."activo",
  p."rolId",
  p."participacionPorc",
  p."horasTotales",
  p."aportesTotales",
  p."valorHora",
  p."inversionHoras",
  p."inversionTotal",
  p."notas",
  p."createdAt",
  p."updatedAt",
  false -- emailVerified = false (requiere activación)
FROM personas p
WHERE p."usuarioId" IS NULL;

-- ============================================
-- PASO 3: Vincular personas recién migradas con nuevos usuarios
-- ============================================

UPDATE personas p
SET "usuarioId" = u.id
FROM usuarios u
WHERE p."usuarioId" IS NULL
  AND u.email = COALESCE(p.email, CONCAT('persona', p.id, '@temp.local'))
  AND u."negocioId" = p."negocioId";

-- ============================================
-- PASO 4: Verificar que TODAS las personas tienen usuarioId
-- ============================================

DO $$
DECLARE
  personas_sin_usuario INT;
BEGIN
  SELECT COUNT(*) INTO personas_sin_usuario FROM personas WHERE "usuarioId" IS NULL;

  IF personas_sin_usuario > 0 THEN
    RAISE EXCEPTION 'Error: % personas sin usuarioId después de migración', personas_sin_usuario;
  END IF;

  RAISE NOTICE 'Migración exitosa: Todas las personas tienen usuarioId';
END $$;

-- ============================================
-- PASO 5: Validar suma de participaciones
-- ============================================

DO $$
DECLARE
  negocio_rec RECORD;
  total_participacion DOUBLE PRECISION;
BEGIN
  FOR negocio_rec IN SELECT DISTINCT "negocioId" FROM usuarios LOOP
    SELECT SUM("participacionPorc") INTO total_participacion
    FROM usuarios
    WHERE "negocioId" = negocio_rec."negocioId" AND activo = true;

    IF total_participacion > 100 THEN
      RAISE WARNING 'Negocio %: Total participación = % (excede 100%%)',
        negocio_rec."negocioId", total_participacion;
    ELSE
      RAISE NOTICE 'Negocio %: Total participación = %',
        negocio_rec."negocioId", total_participacion;
    END IF;
  END LOOP;
END $$;

COMMIT;
