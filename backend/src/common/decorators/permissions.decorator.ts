import { SetMetadata } from '@nestjs/common';
import { Action } from '../../casl/action.enum';
import { Subjects } from '../../casl/subjects.type';

export interface PermissionRequirement {
  action: Action;
  subject: Subjects | string;
}

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to define required permissions for an endpoint
 * @example @Permissions({ action: Action.Read, subject: 'SecurityRole' })
 */
export const Permissions = (...permissions: PermissionRequirement[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
