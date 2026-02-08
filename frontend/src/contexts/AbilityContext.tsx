'use client';

import React, { createContext, useContext } from 'react';
import { createMongoAbility, MongoAbility } from '@casl/ability';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Approve = 'approve',
  Reject = 'reject',
}

export type Subjects =
  | 'Usuario'
  | 'Campana'
  | 'Categoria'
  | 'Transaccion'
  | 'RegistroHoras'
  | 'ValorHora'
  | 'DistribucionUtilidades'
  | 'DistribucionDetalle'
  | 'HourDebt'
  | 'DebtDeduction'
  | 'HourDebtAuditLog'
  | 'Settings'
  | 'SecurityRole'
  | 'Permission'
  | 'SecurityAuditLog'
  | 'SecuritySession'
  | 'SecuritySettings'
  | 'BusinessRole'
  | 'Dashboard'
  | 'Estadisticas'
  | 'Negocio'
  | 'all';

export interface PermissionLike {
  subject: string;
  action: string;
}

export type AppAbility = MongoAbility<[Action, Subjects]>;

const defaultAbility = createMongoAbility<AppAbility>([]);
const AbilityContext = createContext<AppAbility>(defaultAbility);

interface AbilityProviderProps {
  children: React.ReactNode;
  ability?: AppAbility;
}

export const AbilityProvider: React.FC<AbilityProviderProps> = ({
  children,
  ability = defaultAbility,
}) => {
  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
};

export const useAbility = () => {
  const context = useContext(AbilityContext);
  if (!context) {
    throw new Error('useAbility must be used within AbilityProvider');
  }
  return context;
};

export const createAbilityFromPermissions = (permissions: PermissionLike[]): AppAbility => {
  const rules: Array<{ action: Action; subject: Subjects }> = [];

  for (const permission of permissions) {
    const action = String(permission.action).toLowerCase() as Action;
    const subject = permission.subject as Subjects;

    if (action === Action.Manage && subject === 'all') {
      rules.push({ action: Action.Manage, subject: 'all' });
      continue;
    }

    rules.push({ action, subject });
  }

  return createMongoAbility<AppAbility>(rules);
};
