import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

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
  const negocioId = request.user?.negocioId;

  if (!negocioId) {
    throw new UnauthorizedException(
      'Token inválido: negocioId no encontrado. Por favor cierre sesión y vuelva a iniciar sesión.'
    );
  }

  return negocioId;
});
