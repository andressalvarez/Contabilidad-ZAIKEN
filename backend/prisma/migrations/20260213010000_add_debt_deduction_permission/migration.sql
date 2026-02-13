-- Migration: Add DebtDeduction Permission
-- Date: 2026-02-13
-- Author: Claude AI
-- Description: Agrega permiso para ver historial de deducciones de deuda
--
-- Problema: El endpoint GET /hour-debt/:id/deductions requiere permiso
--           'read:DebtDeduction' pero este permiso no existe en el sistema.
--
-- Solución: Crear el permiso DEBT_DEDUCTION.GLOBAL.READ y asignarlo a todos
--           los roles que ya tienen permiso de lectura de HourDebt.
--
-- Archivos modificados:
--   - backend/prisma/seed-security.ts (para futuros seeds)

-- 1. Insertar el nuevo permiso DebtDeduction.read
INSERT INTO permissions (
  code,
  resource,
  context,
  subject,
  action,
  description,
  category,
  route,
  dependencies,
  display_order,
  is_system,
  active
) VALUES (
  'DEBT_DEDUCTION.GLOBAL.READ',
  'DEBT_DEDUCTION',
  'GLOBAL',
  'DebtDeduction',
  'read',
  'Permite consultar historial de pagos de deuda. Ruta: /deuda-horas. Dependencias: ninguna.',
  'hours',
  '/deuda-horas',
  '{}',
  130,
  true,
  true
)
ON CONFLICT (subject, action) DO UPDATE SET
  code = EXCLUDED.code,
  resource = EXCLUDED.resource,
  context = EXCLUDED.context,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  route = EXCLUDED.route,
  dependencies = EXCLUDED.dependencies,
  display_order = EXCLUDED.display_order,
  is_system = EXCLUDED.is_system,
  active = EXCLUDED.active;

-- 2. Asignar el permiso a todos los roles que ya tienen HourDebt.read
-- Esto asegura que cualquier usuario que puede ver deudas también pueda ver su historial
INSERT INTO role_permissions (role_id, permission_id)
SELECT DISTINCT
  rp.role_id,
  (SELECT id FROM permissions WHERE subject = 'DebtDeduction' AND action = 'read')
FROM role_permissions rp
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE p.subject = 'HourDebt' AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;
