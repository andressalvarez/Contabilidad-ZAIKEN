'use client';

import React, { createContext, useContext } from 'react';
import { createMongoAbility, MongoAbility } from '@casl/ability';

// Define available actions
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Approve = 'approve',
  Reject = 'reject',
}

// Define subjects (entities)
export type Subjects =
  | 'Usuario'
  | 'Persona'
  | 'Campana'
  | 'Categoria'
  | 'Transaccion'
  | 'RegistroHoras'
  | 'ValorHora'
  | 'DistribucionUtilidades'
  | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

// Create default ability (no permissions)
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
  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
};

export const useAbility = () => {
  const context = useContext(AbilityContext);
  if (!context) {
    throw new Error('useAbility must be used within AbilityProvider');
  }
  return context;
};

// Helper function to create abilities based on user role
export const createAbilityForUser = (rol: string): AppAbility => {
  const rules: any[] = [];

  if (rol === 'SUPER_ADMIN') {
    rules.push({ action: Action.Manage, subject: 'all' });
  } else if (rol === 'ADMIN_NEGOCIO') {
    rules.push({ action: Action.Manage, subject: 'all' });
  } else if (rol === 'ADMIN') {
    // Full management of most entities
    rules.push(
      { action: Action.Read, subject: 'Usuario' },
      { action: Action.Update, subject: 'Usuario' },
      { action: Action.Create, subject: 'Usuario' },
      { action: Action.Manage, subject: 'Persona' },
      { action: Action.Manage, subject: 'Campana' },
      { action: Action.Manage, subject: 'Categoria' },
      { action: Action.Manage, subject: 'Transaccion' },
      { action: Action.Manage, subject: 'RegistroHoras' },
      { action: Action.Approve, subject: 'RegistroHoras' },
      { action: Action.Reject, subject: 'RegistroHoras' },
      { action: Action.Manage, subject: 'ValorHora' },
      { action: Action.Manage, subject: 'DistribucionUtilidades' }
    );
  } else if (rol === 'MANAGER') {
    rules.push(
      { action: Action.Read, subject: 'Usuario' },
      { action: Action.Read, subject: 'Persona' },
      { action: Action.Update, subject: 'Persona' },
      { action: Action.Read, subject: 'Campana' },
      { action: Action.Create, subject: 'Campana' },
      { action: Action.Update, subject: 'Campana' },
      { action: Action.Read, subject: 'Categoria' },
      { action: Action.Manage, subject: 'Transaccion' },
      { action: Action.Read, subject: 'RegistroHoras' },
      { action: Action.Approve, subject: 'RegistroHoras' },
      { action: Action.Reject, subject: 'RegistroHoras' },
      { action: Action.Read, subject: 'ValorHora' },
      { action: Action.Read, subject: 'DistribucionUtilidades' }
    );
  } else if (rol === 'EMPLEADO') {
    rules.push(
      { action: Action.Read, subject: 'Campana' },
      { action: Action.Read, subject: 'Categoria' },
      { action: Action.Read, subject: 'Transaccion' },
      { action: Action.Create, subject: 'RegistroHoras' },
      { action: Action.Read, subject: 'RegistroHoras' },
      { action: Action.Update, subject: 'RegistroHoras' }, // Only their own non-approved hours
      { action: Action.Delete, subject: 'RegistroHoras' }, // Only their own non-approved hours
      { action: Action.Read, subject: 'Persona' },
      { action: Action.Update, subject: 'Persona' }
    );
  } else if (rol === 'USER') {
    rules.push(
      { action: Action.Read, subject: 'Campana' },
      { action: Action.Read, subject: 'Categoria' },
      { action: Action.Read, subject: 'Transaccion' }
    );
  }

  return createMongoAbility<AppAbility>(rules);
};
