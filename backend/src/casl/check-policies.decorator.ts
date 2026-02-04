import { SetMetadata } from '@nestjs/common';
import { PolicyHandlerType } from './policies.guard';

export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandlerType[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
