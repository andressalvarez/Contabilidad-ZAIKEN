import {
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Action } from './action.enum';
import { Subjects } from './subjects.type';

export type AppAbility = PureAbility<[Action, Subjects]>;

// Permission from database with resolved values
export interface DynamicPermission {
  subject: string;
  action: string;
  conditions?: object | null;
}

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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create ability for user with dynamic permissions (async)
   * Uses database-stored permissions if user has a securityRoleId
   */
  async createForUserAsync(user: {
    id: number;
    rol: string;
    negocioId: number;
    securityRoleId?: number | null;
  }): Promise<AppAbility> {
    // If user has a security role, load permissions from database
    if (user.securityRoleId) {
      const permissions = await this.loadDynamicPermissions(user.securityRoleId);
      return this.buildAbilityFromPermissions(permissions, user);
    }

    // Fall back to legacy hardcoded permissions
    return this.createForUser(user);
  }

  /**
   * Load permissions for a security role from the database
   */
  private async loadDynamicPermissions(roleId: number): Promise<DynamicPermission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => ({
      subject: rp.permission.subject,
      action: rp.permission.action,
      conditions: rp.conditions as object | null,
    }));
  }

  /**
   * Build ability from dynamic permissions
   */
  private buildAbilityFromPermissions(
    permissions: DynamicPermission[],
    user: { id: number },
  ): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(
      PureAbility as AbilityClass<AppAbility>,
    );

    for (const permission of permissions) {
      // Handle special "own" condition - replace with actual user id
      let conditions = permission.conditions;
      if (conditions && typeof conditions === 'object') {
        conditions = this.resolveConditions(conditions, user);
      }

      if (conditions) {
        can(permission.action as Action, permission.subject as any, conditions);
      } else {
        can(permission.action as Action, permission.subject as any);
      }
    }

    return build({ detectSubjectType });
  }

  /**
   * Resolve dynamic conditions like { usuarioId: "own" } -> { usuarioId: 123 }
   */
  private resolveConditions(conditions: object, user: { id: number }): object {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(conditions)) {
      if (value === 'own' || value === '$own') {
        resolved[key] = user.id;
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Create ability for user using legacy hardcoded permissions (sync)
   * Used when user doesn't have a securityRoleId
   */
  createForUser(user: { id: number; rol: string; negocioId: number }): AppAbility {
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

      // Security Management
      can(Action.Manage, 'SecurityRole');
      can(Action.Read, 'Permission');
      can(Action.Read, 'SecurityAuditLog');
      can(Action.Manage, 'SecuritySession');
      can(Action.Manage, 'SecuritySettings');
      can(Action.Read, 'Dashboard');
      can(Action.Read, 'Estadisticas');
      can(Action.Manage, 'Negocio');

      return build({ detectSubjectType });
    }

    // MANAGER: Gestor con permisos intermedios
    if (user.rol === 'MANAGER') {
      // Lectura de usuarios
      can(Action.Read, 'Usuario');

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
      can(Action.Update, 'RegistroHoras', { usuarioId: user.id, aprobado: false });
      can(Action.Delete, 'RegistroHoras', { usuarioId: user.id, aprobado: false });

      // Deuda de horas - puede crear y ver sus propias
      can(Action.Create, 'HourDebt');
      can(Action.Read, 'HourDebt', { usuarioId: user.id });
      can(Action.Read, 'DebtDeduction');

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
