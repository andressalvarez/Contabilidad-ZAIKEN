import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extraer el negocioId del JWT en el request
 * Uso:
 * @Get()
 * async findAll(@NegocioId() negocioId: number) {
 *   return this.service.findAll(negocioId);
 * }
 */
export const NegocioId = createParamDecorator((data: unknown, ctx: ExecutionContext): number => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.negocioId;
});
