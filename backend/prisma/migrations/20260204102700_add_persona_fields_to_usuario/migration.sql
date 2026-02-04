-- Migration: Add Persona fields to Usuario for consolidation
-- Date: 2026-02-04

BEGIN;

-- ============================================
-- PASO 1: Agregar campos de negocio de Persona a Usuario
-- ============================================

ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "rolId" INTEGER;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "participacionPorc" DOUBLE PRECISION DEFAULT 0 NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "horasTotales" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "aportesTotales" DOUBLE PRECISION DEFAULT 0 NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "valorHora" DOUBLE PRECISION DEFAULT 0 NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "inversionHoras" DOUBLE PRECISION DEFAULT 0 NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "inversionTotal" DOUBLE PRECISION DEFAULT 0 NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "notas" TEXT;

-- ============================================
-- PASO 2: Agregar campos para sistema SMTP
-- ============================================

ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "activationToken" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP;

-- ============================================
-- PASO 3: Agregar FK a Rol (opcional)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_rolId_fkey'
  ) THEN
    ALTER TABLE "usuarios"
    ADD CONSTRAINT "usuarios_rolId_fkey"
    FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- PASO 4: Crear índices para performance
-- ============================================

CREATE INDEX IF NOT EXISTS "usuarios_rolId_idx" ON "usuarios"("rolId");
CREATE INDEX IF NOT EXISTS "usuarios_activationToken_idx" ON "usuarios"("activationToken");
CREATE INDEX IF NOT EXISTS "usuarios_resetPasswordToken_idx" ON "usuarios"("resetPasswordToken");

COMMIT;
