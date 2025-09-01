-- Tablas de roles de plataforma
CREATE TABLE IF NOT EXISTS "roles_sistema" (
  "id" SERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL UNIQUE,
  "descripcion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "usuarios_roles" (
  "usuarioId" INTEGER NOT NULL,
  "rolSistemaId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usuarios_roles_pkey" PRIMARY KEY ("usuarioId", "rolSistemaId"),
  CONSTRAINT "usuarios_roles_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "usuarios_roles_rolSistemaId_fkey" FOREIGN KEY ("rolSistemaId") REFERENCES "roles_sistema"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Seed básico: ADMIN y USER
INSERT INTO "roles_sistema" ("nombre", "descripcion", "updatedAt") VALUES
('ADMIN', 'Administrador del sistema', NOW()),
('USER', 'Usuario estándar', NOW())
ON CONFLICT ("nombre") DO NOTHING;

-- Asignar ADMIN al usuario 1 si existe
INSERT INTO "usuarios_roles" ("usuarioId", "rolSistemaId")
SELECT 1, (SELECT id FROM roles_sistema WHERE nombre = 'ADMIN')
WHERE EXISTS (SELECT 1 FROM usuarios WHERE id = 1)
ON CONFLICT DO NOTHING;



