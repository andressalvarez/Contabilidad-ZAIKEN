import {
  Usuario,
  Campana,
  Categoria,
  Transaccion,
  RegistroHoras,
  ValorHora,
  DistribucionUtilidades,
  DistribucionDetalle,
  VSCarpeta,
  VSGrupo,
  VSConfiguracion,
  HourDebt,
  DebtDeduction,
  HourDebtAuditLog,
  SecurityRole,
  Permission,
  RolePermission,
  SecurityAuditLog,
  SecuritySession,
  SecuritySettings,
} from '@prisma/client';

export type Subjects =
  | 'Usuario'
  | Usuario
  | 'Campana'
  | Campana
  | 'Categoria'
  | Categoria
  | 'Transaccion'
  | Transaccion
  | 'RegistroHoras'
  | RegistroHoras
  | 'ValorHora'
  | ValorHora
  | 'DistribucionUtilidades'
  | DistribucionUtilidades
  | 'DistribucionDetalle'
  | DistribucionDetalle
  | 'VSCarpeta'
  | VSCarpeta
  | 'VSGrupo'
  | VSGrupo
  | 'VSConfiguracion'
  | VSConfiguracion
  | 'HourDebt'
  | HourDebt
  | 'DebtDeduction'
  | DebtDeduction
  | 'HourDebtAuditLog'
  | HourDebtAuditLog
  | 'Settings'
  // Security Management
  | 'SecurityRole'
  | SecurityRole
  | 'Permission'
  | Permission
  | 'RolePermission'
  | RolePermission
  | 'SecurityAuditLog'
  | SecurityAuditLog
  | 'SecuritySession'
  | SecuritySession
  | 'SecuritySettings'
  | SecuritySettings
  | 'Dashboard'
  | 'Estadisticas'
  | 'Negocio'
  | 'all';
