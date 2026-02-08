'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Action, useAbility } from '@/contexts/AbilityContext';

interface PermissionRouteGuardProps {
  children: ReactNode;
}

const ROUTE_PERMISSIONS: Array<{
  match: RegExp;
  action: Action;
  subject:
    | 'SecurityRole'
    | 'SecurityAuditLog'
    | 'SecuritySettings'
    | 'BusinessRole'
    | 'Usuario'
    | 'Settings'
    | 'RegistroHoras'
    | 'HourDebt'
    | 'Campana'
    | 'Categoria'
    | 'Transaccion'
    | 'DistribucionUtilidades'
    | 'DistribucionDetalle'
    | 'ValorHora'
    | 'Estadisticas'
    | 'Dashboard';
}> = [
  { match: /^\/admin\/seguridad\/roles/, action: Action.Read, subject: 'SecurityRole' },
  { match: /^\/admin\/seguridad\/auditoria/, action: Action.Read, subject: 'SecurityAuditLog' },
  { match: /^\/admin\/seguridad\/configuracion/, action: Action.Read, subject: 'SecuritySettings' },
  { match: /^\/usuarios/, action: Action.Read, subject: 'Usuario' },
  { match: /^\/roles/, action: Action.Read, subject: 'BusinessRole' },
  { match: /^\/configuracion/, action: Action.Read, subject: 'Settings' },
  { match: /^\/registro-horas/, action: Action.Read, subject: 'RegistroHoras' },
  { match: /^\/horas-pendientes/, action: Action.Approve, subject: 'RegistroHoras' },
  { match: /^\/deuda-horas/, action: Action.Read, subject: 'HourDebt' },
  { match: /^\/categorias/, action: Action.Read, subject: 'Categoria' },
  { match: /^\/campanas/, action: Action.Read, subject: 'Campana' },
  { match: /^\/gastos/, action: Action.Read, subject: 'Campana' },
  { match: /^\/transacciones/, action: Action.Read, subject: 'Transaccion' },
  { match: /^\/tipos-transaccion/, action: Action.Read, subject: 'Transaccion' },
  { match: /^\/distribucion-utilidades/, action: Action.Read, subject: 'DistribucionUtilidades' },
  { match: /^\/distribucion-detalle/, action: Action.Read, subject: 'DistribucionDetalle' },
  { match: /^\/valor-hora/, action: Action.Read, subject: 'ValorHora' },
  { match: /^\/estadisticas/, action: Action.Read, subject: 'Estadisticas' },
  { match: /^\/$/, action: Action.Read, subject: 'Dashboard' },
];

export default function PermissionRouteGuard({ children }: PermissionRouteGuardProps) {
  const pathname = usePathname();
  const ability = useAbility();
  const routePermission = ROUTE_PERMISSIONS.find((item) => item.match.test(pathname));

  const canAccess = routePermission
    ? ability.can(routePermission.action, routePermission.subject)
    : true;

  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Acceso denegado</h2>
        <p className="text-sm text-gray-700">
          Tu rol de sistema no tiene permisos para ver esta sección.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
