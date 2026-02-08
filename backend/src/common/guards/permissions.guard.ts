import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../../casl/casl-ability.factory';
import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator';
import { PERMISSION_CODES_KEY } from '../decorators/require-permission.decorator';
import { Action } from '../../casl/action.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissionCodes = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_CODES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required, allow access
    if (
      (!requiredPermissions || requiredPermissions.length === 0) &&
      (!requiredPermissionCodes || requiredPermissionCodes.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    if (!user.securityRoleId) {
      throw new ForbiddenException('User has no assigned security role');
    }

    const rolePermissions = await this.caslAbilityFactory.getRolePermissions(user.securityRoleId);
    const permissionCodes = new Set(rolePermissions.map((p) => p.code));
    const permissionPairs = new Set(
      rolePermissions.map((p) => `${String(p.action).toLowerCase()}:${String(p.subject)}`),
    );

    request.userPermissions = rolePermissions;
    request.permissionCodes = Array.from(permissionCodes);

    let hasAllPermissions = true;
    const missingPermissionCodes: string[] = [];
    const missingRequirements: string[] = [];

    if (requiredPermissionCodes && requiredPermissionCodes.length > 0) {
      const missingCodes = requiredPermissionCodes.filter((code) => !permissionCodes.has(code));
      if (missingCodes.length > 0) {
        hasAllPermissions = false;
        missingPermissionCodes.push(...missingCodes);
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      requiredPermissions.forEach((permission) => {
        const key = `${String(permission.action).toLowerCase()}:${String(permission.subject)}`;
        if (permissionPairs.has(key)) {
          return;
        }
        // allow "manage" to satisfy all actions for same subject
        if (permissionPairs.has(`${Action.Manage}:${String(permission.subject)}`)) {
          return;
        }

        hasAllPermissions = false;
        missingRequirements.push(`${String(permission.action)}:${String(permission.subject)}`);
        missingPermissionCodes.push(this.toCode(String(permission.subject), String(permission.action)));
      });
    }

    if (!hasAllPermissions) {
      const uniqueCodes = [...new Set(missingPermissionCodes)];
      const detail = uniqueCodes.join(', ');
      throw new ForbiddenException({
        message: `No tienes permiso para esta accion. Permiso(s) faltante(s): ${detail}`,
        missingPermissionCodes: uniqueCodes,
        missingRequirements: [...new Set(missingRequirements)],
      });
    }

    return true;
  }

  private toCode(subject: string, action: string): string {
    const resource = subject
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toUpperCase();

    return `${resource}.GLOBAL.${action.toUpperCase()}`;
  }
}
