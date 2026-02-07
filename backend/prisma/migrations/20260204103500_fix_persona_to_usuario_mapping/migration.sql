-- Migration: Fix Persona to Usuario mapping - Create individual users
-- Date: 2026-02-04
-- Updated: 2026-02-07 - Handle case where all personas have usuarioId = 1
--
-- SCENARIO: Production backup has all personas pointing to usuarioId = 1 (admin)
-- This migration creates individual users for each persona (except #1 which keeps admin)

-- ============================================
-- PASO 0: Resetear secuencia de usuarios
-- Evita conflicto de IDs al insertar nuevos usuarios
-- ============================================

SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 1));

-- ============================================
-- PASO 1: Crear usuarios para personas 2-5
-- Usa secuencia automática, no IDs fijos
-- ============================================

DO $$
DECLARE
  persona_rec RECORD;
  new_usuario_id INT;
  generated_email TEXT;
BEGIN
  -- Para cada persona excepto la #1
  FOR persona_rec IN
    SELECT * FROM personas WHERE id > 1 ORDER BY id
  LOOP
    -- Generar email único
    generated_email := 'persona' || persona_rec.id || '@temp.local';

    -- Verificar si ya existe un usuario con este email
    SELECT id INTO new_usuario_id FROM usuarios WHERE email = generated_email;

    IF new_usuario_id IS NULL THEN
      -- Crear nuevo usuario
      INSERT INTO usuarios (
        "negocioId", "email", "password", "nombre", "rol", "activo",
        "rolId", "participacionPorc", "horasTotales", "aportesTotales",
        "valorHora", "inversionHoras", "inversionTotal", "notas",
        "createdAt", "updatedAt", "emailVerified"
      ) VALUES (
        persona_rec."negocioId",
        generated_email,
        '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
        persona_rec."nombre",
        'EMPLEADO',
        persona_rec."activo",
        persona_rec."rolId",
        persona_rec."participacionPorc",
        persona_rec."horasTotales",
        persona_rec."aportesTotales",
        persona_rec."valorHora",
        persona_rec."inversionHoras",
        persona_rec."inversionTotal",
        persona_rec."notas",
        persona_rec."createdAt",
        persona_rec."updatedAt",
        false
      ) RETURNING id INTO new_usuario_id;

      RAISE NOTICE 'Creado usuario % para persona %', new_usuario_id, persona_rec.id;
    END IF;

    -- Actualizar persona con nuevo usuarioId
    UPDATE personas SET "usuarioId" = new_usuario_id WHERE id = persona_rec.id;

  END LOOP;
END $$;

-- ============================================
-- PASO 2: Actualizar admin con datos de persona #1
-- ============================================

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
WHERE p.id = 1 AND u.id = 1;

-- ============================================
-- PASO 3: Verificar resultado
-- ============================================

DO $$
DECLARE
  total_usuarios INT;
  total_personas INT;
  usuarios_unicos INT;
BEGIN
  SELECT COUNT(*) INTO total_usuarios FROM usuarios;
  SELECT COUNT(*) INTO total_personas FROM personas;
  SELECT COUNT(DISTINCT "usuarioId") INTO usuarios_unicos FROM personas;

  RAISE NOTICE 'Usuarios: %, Personas: %, Usuarios únicos en personas: %',
    total_usuarios, total_personas, usuarios_unicos;

  IF usuarios_unicos = total_personas THEN
    RAISE NOTICE 'OK: Cada persona tiene su propio usuario';
  ELSE
    RAISE WARNING 'WARN: Algunas personas comparten usuario';
  END IF;
END $$;
