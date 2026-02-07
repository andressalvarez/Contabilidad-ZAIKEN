import {
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action } from './action.enum';
import { Subjects } from './subjects.type';

export type AppAbility = PureAbility<[Action, Subjects]>;

// Helper function para detectar el tipo de subject
function detectSubjectType(item: any): ExtractSubjectType<Subjects> {
  if (typeof item === 'string') {
    return item as ExtractSubjectType<Subjects>;
  }
  // Para objetos, usar el nombre del constructor
  return (item.constructor?.name || 'all') as ExtractSubjectType<Subjects>;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: { id: number; rol: string; negocioId: number }) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      PureAbility as AbilityClass<AppAbility>,
    );

    // SUPER_ADMIN: Acceso total a todo
    if (user.rol === 'SUPER_ADMIN') {
      can(Action.Manage, 'all');
      return build({ detectSubjectType });
    }

    // ADMIN_NEGOCIO: Acceso total a su negocio
    if (user.rol === 'ADMIN_NEGOCIO') {
      can(Action.Manage, 'all'); // Puede hacer todo en su negocio
      // La restricción por negocioId se hace a nivel de servicio
      return build({ detectSubjectType });
    }

    // ADMIN: Administrador con permisos amplios
    if (user.rol === 'ADMIN') {
      // Gestión de usuarios
      can(Action.Read, 'Usuario');
      can(Action.Update, 'Usuario');
      can(Action.Create, 'Usuario');

      // Gestión de personas
      can(Action.Manage, 'Persona');

      // Gestión de campañas
      can(Action.Manage, 'Campana');

      // Gestión de categorías
      can(Action.Manage, 'Categoria');

      // Gestión de transacciones
      can(Action.Manage, 'Transaccion');

      // Gestión de horas
      can(Action.Manage, 'RegistroHoras');
      can(Action.Approve, 'RegistroHoras');
      can(Action.Reject, 'RegistroHoras');

      // Gestión de deuda de horas (FULL ACCESS)
      can(Action.Manage, 'HourDebt');
      can(Action.Manage, 'DebtDeduction');
      can(Action.Read, 'HourDebtAuditLog');

      // Gestión de valor hora
      can(Action.Manage, 'ValorHora');

      // Distribuciones
      can(Action.Manage, 'DistribucionUtilidades');
      can(Action.Manage, 'DistribucionDetalle');

      // VS (Visual Studio)
      can(Action.Manage, 'VSCarpeta');
      can(Action.Manage, 'VSGrupo');
      can(Action.Manage, 'VSConfiguracion');

      // Settings (SMTP, configuración del sistema)
      can(Action.Manage, 'Settings');

      return build({ detectSubjectType });
    }

    // MANAGER: Gestor con permisos intermedios
    if (user.rol === 'MANAGER') {
      // Lectura de usuarios
      can(Action.Read, 'Usuario');

      // Gestión de personas
      can(Action.Read, 'Persona');
      can(Action.Update, 'Persona');

      // Gestión de campañas
      can(Action.Read, 'Campana');
      can(Action.Create, 'Campana');
      can(Action.Update, 'Campana');

      // Categorías
      can(Action.Read, 'Categoria');

      // Transacciones
      can(Action.Manage, 'Transaccion');

      // Horas - puede aprobar/rechazar
      can(Action.Read, 'RegistroHoras');
      can(Action.Approve, 'RegistroHoras');
      can(Action.Reject, 'RegistroHoras');

      // Deuda de horas - puede ver todas y crear para usuarios
      can(Action.Manage, 'HourDebt');
      can(Action.Read, 'DebtDeduction');

      // Valor hora
      can(Action.Read, 'ValorHora');

      // Distribuciones (solo lectura)
      can(Action.Read, 'DistribucionUtilidades');
      can(Action.Read, 'DistribucionDetalle');

      return build({ detectSubjectType });
    }

    // EMPLEADO: Permisos básicos
    if (user.rol === 'EMPLEADO') {
      // Lectura de campañas y categorías
      can(Action.Read, 'Campana');
      can(Action.Read, 'Categoria');

      // Puede ver transacciones
      can(Action.Read, 'Transaccion');

      // Registro de horas - puede crear y ver sus propias
      can(Action.Create, 'RegistroHoras');
      can(Action.Read, 'RegistroHoras');
      // Solo puede actualizar/eliminar sus propias horas no aprobadas
      can(Action.Update, 'RegistroHoras', { personaId: user.id, aprobado: false });
      can(Action.Delete, 'RegistroHoras', { personaId: user.id, aprobado: false });

      // Deuda de horas - puede crear y ver sus propias
      can(Action.Create, 'HourDebt'); // Solo para sí mismo (validado en controller)
      can(Action.Read, 'HourDebt', { usuarioId: user.id });
      can(Action.Read, 'DebtDeduction'); // Ver sus propias deducciones

      // Puede ver su persona
      can(Action.Read, 'Persona', { usuarioId: user.id });
      can(Action.Update, 'Persona', { usuarioId: user.id });

      // Puede ver su usuario
      can(Action.Read, 'Usuario', { id: user.id });
      can(Action.Update, 'Usuario', { id: user.id });

      return build({ detectSubjectType });
    }

    // USER: Permisos muy básicos (rol por defecto)
    if (user.rol === 'USER') {
      // Solo lectura básica
      can(Action.Read, 'Campana');
      can(Action.Read, 'Categoria');
      can(Action.Read, 'Transaccion');

      // Puede ver y editar su perfil
      can(Action.Read, 'Usuario', { id: user.id });
      can(Action.Update, 'Usuario', { id: user.id });

      return build({ detectSubjectType });
    }

    // Por defecto, sin permisos
    return build({ detectSubjectType });
  }
}
