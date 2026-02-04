'use client';

import React, { ReactNode } from 'react';
import { useAbility, Action, Subjects } from '@/contexts/AbilityContext';

interface CanProps {
  I: Action;
  a: Subjects;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente para mostrar contenido condicionalmente basado en permisos CASL
 *
 * @example
 * <Can I={Action.Create} a="Campana">
 *   <button>Crear Campaña</button>
 * </Can>
 *
 * @example
 * <Can I={Action.Delete} a="Transaccion" fallback={<p>No tienes permiso</p>}>
 *   <button>Eliminar</button>
 * </Can>
 */
export const Can: React.FC<CanProps> = ({ I, a, children, fallback = null }) => {
  const ability = useAbility();

  if (ability.can(I, a)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Hook para verificar permisos
 *
 * @example
 * const canCreateCampana = useCan(Action.Create, 'Campana');
 * if (canCreateCampana) {
 *   // Mostrar botón
 * }
 */
export const useCan = (action: Action, subject: Subjects): boolean => {
  const ability = useAbility();
  return ability.can(action, subject);
};
