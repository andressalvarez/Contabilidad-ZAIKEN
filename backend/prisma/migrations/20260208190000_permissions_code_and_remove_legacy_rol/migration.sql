-- Add new permission fields
ALTER TABLE "permissions"
  ADD COLUMN IF NOT EXISTS "code" TEXT,
  ADD COLUMN IF NOT EXISTS "resource" TEXT,
  ADD COLUMN IF NOT EXISTS "context" TEXT,
  ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true;

-- Backfill permission identifiers
UPDATE "permissions"
SET
  "resource" = UPPER(REGEXP_REPLACE("subject", '([a-z0-9])([A-Z])', '\1_\2', 'g')),
  "context" = COALESCE("context", 'GLOBAL'),
  "code" = UPPER(REGEXP_REPLACE("subject", '([a-z0-9])([A-Z])', '\1_\2', 'g')) || '.GLOBAL.' || UPPER("action"),
  "is_system" = COALESCE("is_system", true),
  "active" = COALESCE("active", true)
WHERE "code" IS NULL OR "resource" IS NULL OR "context" IS NULL;

-- Ensure defaults
ALTER TABLE "permissions"
  ALTER COLUMN "resource" SET NOT NULL,
  ALTER COLUMN "context" SET NOT NULL,
  ALTER COLUMN "code" SET NOT NULL,
  ALTER COLUMN "is_system" SET NOT NULL,
  ALTER COLUMN "active" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'permissions_code_key'
  ) THEN
    CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");
  END IF;
END$$;

-- Ensure system roles exist per business
INSERT INTO "security_roles" (
  "negocio_id", "name", "description", "color", "is_system", "priority", "active", "created_at", "updated_at"
)
SELECT n."id", 'Administrador', 'Rol administrador del sistema', '#6366f1', true, 100, true, NOW(), NOW()
FROM "negocios" n
WHERE NOT EXISTS (
  SELECT 1 FROM "security_roles" sr WHERE sr."negocio_id" = n."id" AND sr."name" = 'Administrador'
);

INSERT INTO "security_roles" (
  "negocio_id", "name", "description", "color", "is_system", "priority", "active", "created_at", "updated_at"
)
SELECT n."id", 'Empleado', 'Rol empleado del sistema', '#10b981', true, 50, true, NOW(), NOW()
FROM "negocios" n
WHERE NOT EXISTS (
  SELECT 1 FROM "security_roles" sr WHERE sr."negocio_id" = n."id" AND sr."name" = 'Empleado'
);

INSERT INTO "security_roles" (
  "negocio_id", "name", "description", "color", "is_system", "priority", "active", "created_at", "updated_at"
)
SELECT n."id", 'Usuario', 'Rol usuario base del sistema', '#3b82f6', true, 10, true, NOW(), NOW()
FROM "negocios" n
WHERE NOT EXISTS (
  SELECT 1 FROM "security_roles" sr WHERE sr."negocio_id" = n."id" AND sr."name" = 'Usuario'
);

-- Map users to security roles using legacy role value when available
UPDATE "usuarios" u
SET "securityRoleId" = sr."id"
FROM "security_roles" sr
WHERE sr."negocio_id" = u."negocioId"
  AND (
    (u."rol" IN ('ADMIN', 'ADMIN_NEGOCIO') AND sr."name" = 'Administrador') OR
    (u."rol" = 'EMPLEADO' AND sr."name" = 'Empleado') OR
    (u."rol" = 'USER' AND sr."name" = 'Usuario') OR
    (u."rol" = 'MANAGER' AND sr."name" = 'Administrador')
  )
  AND u."securityRoleId" IS NULL;

-- Fallback: assign Usuario role if still null
UPDATE "usuarios" u
SET "securityRoleId" = sr."id"
FROM "security_roles" sr
WHERE sr."negocio_id" = u."negocioId"
  AND sr."name" = 'Usuario'
  AND u."securityRoleId" IS NULL;

-- Enforce and remove legacy column
ALTER TABLE "usuarios"
  ALTER COLUMN "securityRoleId" SET NOT NULL;

ALTER TABLE "usuarios"
  DROP COLUMN IF EXISTS "rol";
