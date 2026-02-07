-- Migration: Copy Persona data to Usuario
-- Date: 2026-02-04
-- Updated: 2026-02-07 - Fix to link CEO persona to existing Admin user
--
-- IMPORTANTE: El Admin existente (contacto@zaiken.com.co) se convierte en el CEO
-- - El email del Admin se MANTIENE (no se sobrescribe)
-- - Solo se actualizan: nombre, rolId, participación, valorHora, etc.

BEGIN;

-- ============================================
-- PASO 0: Vincular persona principal (CEO) al Admin existente
-- El Admin (contacto@zaiken.com.co) = CEO del negocio
-- Evita duplicar usuario Admin + usuario CEO
-- ============================================

DO $$
DECLARE
  negocio_rec RECORD;
  admin_usuario_id INT;
  persona_principal_id INT;
BEGIN
  -- Para cada negocio
  FOR negocio_rec IN SELECT DISTINCT "negocioId" FROM personas LOOP

    -- Buscar si hay un usuario ADMIN en este negocio
    SELECT id INTO admin_usuario_id
    FROM usuarios
    WHERE "negocioId" = negocio_rec."negocioId"
      AND rol = 'ADMIN'
    LIMIT 1;

    IF admin_usuario_id IS NOT NULL THEN
      -- Buscar la persona con el rol de mayor importancia (menor rolId = más importante)
      -- que NO tenga usuarioId asignado
      SELECT p.id INTO persona_principal_id
      FROM personas p
      JOIN roles r ON p."rolId" = r.id
      WHERE p."negocioId" = negocio_rec."negocioId"
        AND p."usuarioId" IS NULL
      ORDER BY r.importancia DESC, p.id ASC
      LIMIT 1;

      IF persona_principal_id IS NOT NULL THEN
        -- Vincular esta persona al Admin existente
        UPDATE personas
        SET "usuarioId" = admin_usuario_id
        WHERE id = persona_principal_id;

        -- Actualizar el Admin con los datos de esta persona
        -- NOTA: El email NO se actualiza - se mantiene contacto@zaiken.com.co
        UPDATE usuarios u
        SET
          nombre = p.nombre,  -- Actualiza nombre a "Andrés Salamanca" (CEO)
          "rolId" = p."rolId",
          "participacionPorc" = p."participacionPorc",
          "horasTotales" = p."horasTotales",
          "aportesTotales" = p."aportesTotales",
          "valorHora" = p."valorHora",
          "inversionHoras" = p."inversionHoras",
          "inversionTotal" = p."inversionTotal",
          "notas" = p."notas"
        FROM personas p
        WHERE p.id = persona_principal_id
          AND u.id = admin_usuario_id;

        RAISE NOTICE 'Negocio %: Persona % vinculada a Admin existente (usuario %)',
          negocio_rec."negocioId", persona_principal_id, admin_usuario_id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- PASO 1: Actualizar Admin con datos de persona CEO (si ya está vinculado)
-- Maneja el caso donde todas las personas ya tienen usuarioId = Admin
-- ============================================

UPDATE usuarios u
SET
  nombre = p.nombre,  -- Actualiza nombre a "Andrés Salamanca" (CEO)
  "rolId" = COALESCE(p."rolId", u."rolId"),
  "participacionPorc" = COALESCE(p."participacionPorc", u."participacionPorc"),
  "horasTotales" = COALESCE(p."horasTotales", u."horasTotales"),
  "aportesTotales" = COALESCE(p."aportesTotales", u."aportesTotales"),
  "valorHora" = COALESCE(p."valorHora", u."valorHora"),
  "inversionHoras" = COALESCE(p."inversionHoras", u."inversionHoras"),
  "inversionTotal" = COALESCE(p."inversionTotal", u."inversionTotal"),
  "notas" = COALESCE(p."notas", u."notas")
FROM personas p
JOIN roles r ON p."rolId" = r.id
WHERE p."usuarioId" = u.id
  AND u.rol = 'ADMIN'  -- Solo actualizar si es Admin
  AND r.importancia = (SELECT MAX(r2.importancia) FROM personas p2 JOIN roles r2 ON p2."rolId" = r2.id WHERE p2."usuarioId" = u.id);
  -- Solo la persona con mayor importancia (CEO) actualiza el Admin

-- Actualizar también usuarios no-admin con datos de sus personas
UPDATE usuarios u
SET
  "rolId" = COALESCE(p."rolId", u."rolId"),
  "participacionPorc" = COALESCE(p."participacionPorc", u."participacionPorc"),
  "horasTotales" = COALESCE(p."horasTotales", u."horasTotales"),
  "aportesTotales" = COALESCE(p."aportesTotales", u."aportesTotales"),
  "valorHora" = COALESCE(p."valorHora", u."valorHora"),
  "inversionHoras" = COALESCE(p."inversionHoras", u."inversionHoras"),
  "inversionTotal" = COALESCE(p."inversionTotal", u."inversionTotal"),
  "notas" = COALESCE(p."notas", u."notas")
FROM personas p
WHERE p."usuarioId" = u.id
  AND u.rol != 'ADMIN';

-- ============================================
-- PASO 2: Crear usuarios para personas SIN usuario vinculado
-- (ya no incluye la persona principal/CEO)
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
  COALESCE(p."email", LOWER(REPLACE(p."nombre", ' ', '.')) || '@zaiken.local'),
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- hash de "TempPassword123!"
  p."nombre",
  'USER', -- Rol por defecto para no-admins
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
  AND u.email = COALESCE(p.email, LOWER(REPLACE(p."nombre", ' ', '.')) || '@zaiken.local')
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
