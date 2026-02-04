import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory, AppAbility } from './casl-ability.factory';
import { CHECK_POLICIES_KEY } from './check-policies.decorator';

export interface PolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandlerType = PolicyHandler | PolicyHandlerCallback;

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandlerType[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    if (!policyHandlers.length) {
      return true; // No hay políticas definidas, permitir acceso
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false; // No hay usuario autenticado
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );
  }

  private execPolicyHandler(handler: PolicyHandlerType, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
