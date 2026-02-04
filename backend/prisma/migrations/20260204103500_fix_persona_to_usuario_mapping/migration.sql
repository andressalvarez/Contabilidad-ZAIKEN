-- Migration: Fix Persona to Usuario mapping - Create individual users
-- Date: 2026-02-04

BEGIN;

-- ============================================
-- PASO 1: Crear usuarios individuales para cada persona
--         (excepto la primera que ya está vinculada al admin)
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
WHERE p.id > 1; -- Saltar la primera persona (ya tiene usuario admin)

-- ============================================
-- PASO 2: Actualizar usuarioId en personas para apuntar a usuarios nuevos
-- ============================================

-- Para cada persona (excepto la #1), buscar su usuario por nombre y email
UPDATE personas p
SET "usuarioId" = u.id
FROM usuarios u
WHERE p.id > 1
  AND u.nombre = p.nombre
  AND u."negocioId" = p."negocioId"
  AND u.email = COALESCE(p.email, CONCAT('persona', p.id, '@temp.local'));

-- ============================================
-- PASO 3: Actualizar usuario admin con datos de primera persona
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
WHERE p.id = 1
  AND u.id = 1;

-- ============================================
-- PASO 4: Verificar resultado
-- ============================================

DO $$
DECLARE
  total_usuarios INT;
  total_personas INT;
  personas_sin_usuario INT;
BEGIN
  SELECT COUNT(*) INTO total_usuarios FROM usuarios;
  SELECT COUNT(*) INTO total_personas FROM personas;
  SELECT COUNT(*) INTO personas_sin_usuario FROM personas WHERE "usuarioId" IS NULL;

  RAISE NOTICE 'Total usuarios: %', total_usuarios;
  RAISE NOTICE 'Total personas: %', total_personas;
  RAISE NOTICE 'Personas sin usuario: %', personas_sin_usuario;

  IF personas_sin_usuario > 0 THEN
    RAISE EXCEPTION 'Error: % personas sin usuarioId', personas_sin_usuario;
  END IF;

  IF total_usuarios != total_personas THEN
    RAISE WARNING 'Total usuarios (%) diferente de total personas (%)', total_usuarios, total_personas;
  ELSE
    RAISE NOTICE 'Migración exitosa: 1 usuario por cada persona';
  END IF;
END $$;

-- ============================================
-- PASO 5: Validar participaciones
-- ============================================

DO $$
DECLARE
  total_participacion DOUBLE PRECISION;
BEGIN
  SELECT SUM("participacionPorc") INTO total_participacion
  FROM usuarios
  WHERE "negocioId" = 1 AND activo = true;

  RAISE NOTICE 'Total participación en negocio 1: %', total_participacion;
END $$;

COMMIT;
