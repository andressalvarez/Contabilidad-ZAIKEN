-- Migration: Add Security Management System
-- Date: 2026-02-07
-- Description: Implements dynamic roles, permissions, audit logging, sessions, and security settings

BEGIN;

-- ============================================
-- PASO 1: Agregar campos de seguridad a usuarios
-- ============================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "securityRoleId" INTEGER;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "lastPasswordChange" TIMESTAMP(3);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- PASO 2: Crear tabla security_roles
-- Roles de seguridad configurables por negocio
-- ============================================

CREATE TABLE IF NOT EXISTS security_roles (
  "id" SERIAL PRIMARY KEY,
  "negocio_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: un nombre de rol único por negocio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_roles_negocioId_name_key'
  ) THEN
    ALTER TABLE security_roles ADD CONSTRAINT "security_roles_negocioId_name_key" UNIQUE ("negocio_id", "name");
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS "security_roles_negocio_id_idx" ON security_roles("negocio_id");
CREATE INDEX IF NOT EXISTS "security_roles_negocio_id_active_idx" ON security_roles("negocio_id", "active");

-- FK a negocios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_roles_negocio_id_fkey'
  ) THEN
    ALTER TABLE security_roles ADD CONSTRAINT "security_roles_negocio_id_fkey"
    FOREIGN KEY ("negocio_id") REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- PASO 3: Crear tabla permissions
-- Catálogo global de permisos
-- ============================================

CREATE TABLE IF NOT EXISTS permissions (
  "id" SERIAL PRIMARY KEY,
  "subject" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0
);

-- Unique constraint: subject+action único
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'permissions_subject_action_key'
  ) THEN
    ALTER TABLE permissions ADD CONSTRAINT "permissions_subject_action_key" UNIQUE ("subject", "action");
  END IF;
END $$;

-- Índice por categoría
CREATE INDEX IF NOT EXISTS "permissions_category_idx" ON permissions("category");

-- ============================================
-- PASO 4: Crear tabla role_permissions
-- Permisos asignados a cada rol
-- ============================================

CREATE TABLE IF NOT EXISTS role_permissions (
  "id" SERIAL PRIMARY KEY,
  "role_id" INTEGER NOT NULL,
  "permission_id" INTEGER NOT NULL,
  "conditions" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: un permiso por rol una vez
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_permission_id_key'
  ) THEN
    ALTER TABLE role_permissions ADD CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS "role_permissions_role_id_idx" ON role_permissions("role_id");
CREATE INDEX IF NOT EXISTS "role_permissions_permission_id_idx" ON role_permissions("permission_id");

-- FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_fkey'
  ) THEN
    ALTER TABLE role_permissions ADD CONSTRAINT "role_permissions_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES security_roles(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_permission_id_fkey'
  ) THEN
    ALTER TABLE role_permissions ADD CONSTRAINT "role_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- PASO 5: Crear tabla security_audit_logs
-- Log de auditoría de seguridad
-- ============================================

CREATE TABLE IF NOT EXISTS security_audit_logs (
  "id" SERIAL PRIMARY KEY,
  "negocio_id" INTEGER NOT NULL,
  "user_id" INTEGER,
  "event_type" TEXT NOT NULL,
  "target_type" TEXT,
  "target_id" INTEGER,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS "security_audit_logs_negocio_created_idx" ON security_audit_logs("negocio_id", "created_at");
CREATE INDEX IF NOT EXISTS "security_audit_logs_negocio_event_idx" ON security_audit_logs("negocio_id", "event_type");
CREATE INDEX IF NOT EXISTS "security_audit_logs_negocio_user_idx" ON security_audit_logs("negocio_id", "user_id");
CREATE INDEX IF NOT EXISTS "security_audit_logs_user_created_idx" ON security_audit_logs("user_id", "created_at");

-- FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_audit_logs_negocio_id_fkey'
  ) THEN
    ALTER TABLE security_audit_logs ADD CONSTRAINT "security_audit_logs_negocio_id_fkey"
    FOREIGN KEY ("negocio_id") REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_audit_logs_user_id_fkey'
  ) THEN
    ALTER TABLE security_audit_logs ADD CONSTRAINT "security_audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- PASO 6: Crear tabla security_sessions
-- Sesiones activas de usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS security_sessions (
  "id" TEXT PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "negocio_id" INTEGER NOT NULL,
  "token_hash" TEXT NOT NULL,
  "device_info" TEXT,
  "ip_address" TEXT,
  "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint para token_hash
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_sessions_token_hash_key'
  ) THEN
    ALTER TABLE security_sessions ADD CONSTRAINT "security_sessions_token_hash_key" UNIQUE ("token_hash");
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS "security_sessions_user_id_idx" ON security_sessions("user_id");
CREATE INDEX IF NOT EXISTS "security_sessions_user_active_idx" ON security_sessions("user_id", "is_active");
CREATE INDEX IF NOT EXISTS "security_sessions_expires_idx" ON security_sessions("expires_at");
CREATE INDEX IF NOT EXISTS "security_sessions_negocio_idx" ON security_sessions("negocio_id");

-- FK a usuarios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE security_sessions ADD CONSTRAINT "security_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- PASO 7: Crear tabla security_settings
-- Configuración de seguridad por negocio
-- ============================================

CREATE TABLE IF NOT EXISTS security_settings (
  "id" SERIAL PRIMARY KEY,
  "negocio_id" INTEGER NOT NULL UNIQUE,

  -- Políticas de contraseña
  "min_password_length" INTEGER NOT NULL DEFAULT 8,
  "require_uppercase" BOOLEAN NOT NULL DEFAULT true,
  "require_numbers" BOOLEAN NOT NULL DEFAULT true,
  "require_special_chars" BOOLEAN NOT NULL DEFAULT false,
  "password_expiration_days" INTEGER NOT NULL DEFAULT 0,

  -- Políticas de sesión
  "session_timeout_minutes" INTEGER NOT NULL DEFAULT 480,
  "max_concurrent_sessions" INTEGER NOT NULL DEFAULT 5,

  -- Políticas de bloqueo
  "max_login_attempts" INTEGER NOT NULL DEFAULT 5,
  "lockout_duration_minutes" INTEGER NOT NULL DEFAULT 15,

  -- Auditoría
  "audit_retention_days" INTEGER NOT NULL DEFAULT 365,
  "log_all_actions" BOOLEAN NOT NULL DEFAULT true,

  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FK a negocios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_settings_negocio_id_fkey'
  ) THEN
    ALTER TABLE security_settings ADD CONSTRAINT "security_settings_negocio_id_fkey"
    FOREIGN KEY ("negocio_id") REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- PASO 8: Agregar FK de usuarios a security_roles
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_securityRoleId_fkey'
  ) THEN
    ALTER TABLE usuarios ADD CONSTRAINT "usuarios_securityRoleId_fkey"
    FOREIGN KEY ("securityRoleId") REFERENCES security_roles(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Índices en usuarios para seguridad
CREATE INDEX IF NOT EXISTS "usuarios_securityRoleId_idx" ON usuarios("securityRoleId");
CREATE INDEX IF NOT EXISTS "usuarios_lockedUntil_idx" ON usuarios("lockedUntil");

-- ============================================
-- PASO 9: Crear roles del sistema por defecto para negocios existentes
-- ============================================

DO $$
DECLARE
  negocio_rec RECORD;
BEGIN
  FOR negocio_rec IN SELECT id FROM negocios LOOP
    -- Rol Administrador (sistema - no editable)
    INSERT INTO security_roles ("negocio_id", "name", "description", "color", "is_system", "priority", "active")
    VALUES (negocio_rec.id, 'Administrador', 'Control total del sistema', '#6366f1', true, 100, true)
    ON CONFLICT ("negocio_id", "name") DO NOTHING;

    -- Rol Manager
    INSERT INTO security_roles ("negocio_id", "name", "description", "color", "is_system", "priority", "active")
    VALUES (negocio_rec.id, 'Manager', 'Gestión de equipo y operaciones', '#8b5cf6', true, 50, true)
    ON CONFLICT ("negocio_id", "name") DO NOTHING;

    -- Rol Empleado
    INSERT INTO security_roles ("negocio_id", "name", "description", "color", "is_system", "priority", "active")
    VALUES (negocio_rec.id, 'Empleado', 'Operaciones básicas', '#10b981', true, 25, true)
    ON CONFLICT ("negocio_id", "name") DO NOTHING;

    -- Rol Usuario (básico)
    INSERT INTO security_roles ("negocio_id", "name", "description", "color", "is_system", "priority", "active")
    VALUES (negocio_rec.id, 'Usuario', 'Acceso básico al sistema', '#6b7280', true, 10, true)
    ON CONFLICT ("negocio_id", "name") DO NOTHING;

    -- Crear configuración de seguridad por defecto
    INSERT INTO security_settings ("negocio_id")
    VALUES (negocio_rec.id)
    ON CONFLICT ("negocio_id") DO NOTHING;

    RAISE NOTICE 'Negocio %: Roles de sistema y configuración creados', negocio_rec.id;
  END LOOP;
END $$;

-- ============================================
-- PASO 10: Verificación final
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_roles') THEN
    RAISE EXCEPTION 'Error: Tabla security_roles no fue creada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
    RAISE EXCEPTION 'Error: Tabla permissions no fue creada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
    RAISE EXCEPTION 'Error: Tabla role_permissions no fue creada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_logs') THEN
    RAISE EXCEPTION 'Error: Tabla security_audit_logs no fue creada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_sessions') THEN
    RAISE EXCEPTION 'Error: Tabla security_sessions no fue creada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_settings') THEN
    RAISE EXCEPTION 'Error: Tabla security_settings no fue creada';
  END IF;

  RAISE NOTICE '=============================================';
  RAISE NOTICE 'Sistema de Seguridad creado exitosamente';
  RAISE NOTICE 'Tablas: security_roles, permissions, role_permissions';
  RAISE NOTICE '         security_audit_logs, security_sessions, security_settings';
  RAISE NOTICE '=============================================';
END $$;

COMMIT;
