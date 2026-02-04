import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Servicio base para implementar multi-tenant
 * Agrega automáticamente el filtro de negocioId a todas las consultas
 */
export abstract class BaseMultiTenantService {
  /**
   * Agrega negocioId al where condition de Prisma
   */
  protected addNegocioIdFilter<T extends { where?: any }>(
    query: T,
    negocioId: number,
  ): T {
    if (!query.where) {
      query.where = {};
    }
    (query.where as any).negocioId = negocioId;
    return query;
  }

  /**
   * Valida que un registro pertenezca al negocio del usuario
   */
  protected validateNegocio(recordNegocioId: number, userNegocioId: number): void {
    if (recordNegocioId !== userNegocioId) {
      throw new ForbiddenException('No tienes acceso a este recurso');
    }
  }

  /**
   * Genera where clause con negocioId
   */
  protected whereWithNegocio<T extends Record<string, any>>(
    negocioId: number,
    additionalWhere?: T,
  ): T & { negocioId: number } {
    return {
      ...additionalWhere,
      negocioId,
    } as T & { negocioId: number };
  }
}
