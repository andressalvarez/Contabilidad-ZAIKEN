import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory, AppAbility } from '../../casl/casl-ability.factory';
import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator';

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

    // No permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    // Use async method if user has securityRoleId, otherwise use sync method
    let ability: AppAbility;
    if (user.securityRoleId) {
      ability = await this.caslAbilityFactory.createForUserAsync(user);
    } else {
      ability = this.caslAbilityFactory.createForUser(user);
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) => {
      const result = ability.can(permission.action, permission.subject as any);
      return result;
    });

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
