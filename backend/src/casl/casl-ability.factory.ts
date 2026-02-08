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
  code: string;
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
    negocioId: number;
    securityRoleId?: number | null;
  }): Promise<AppAbility> {
    if (!user.securityRoleId) {
      return this.createForUser(user);
    }

    const permissions = await this.getRolePermissions(user.securityRoleId);
    return this.buildAbilityFromPermissions(permissions, user);
  }

  /**
   * Load permissions for a security role from the database
   */
  async getRolePermissions(roleId: number): Promise<DynamicPermission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
        permission: {
          active: true,
        },
      },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => ({
      code: rp.permission.code,
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
   * Legacy fallback disabled by design: return empty ability if no security role.
   */
  createForUser(_user: { id: number; negocioId: number }): AppAbility {
    const { build } = new AbilityBuilder<AppAbility>(
      PureAbility as AbilityClass<AppAbility>,
    );
    return build({ detectSubjectType });
  }
}
