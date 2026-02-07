import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampanaDto, UpdateCampanaDto } from './dto';

@Injectable()
export class CampanasService {
  constructor(private prisma: PrismaService) {}

  async create(negocioId: number, createCampanaDto: CreateCampanaDto) {
    return this.prisma.campana.create({
      data: {
        negocioId,
        nombre: createCampanaDto.nombre,
        fechaInicio: new Date(createCampanaDto.fechaInicio),
        fechaFin: new Date(createCampanaDto.fechaFin),
        presupuesto: createCampanaDto.presupuesto || 0,
        ingresoTotal: createCampanaDto.objetivoIngresos || 0,
        descripcion: createCampanaDto.descripcion,
        activo: createCampanaDto.activo ?? true,
      },
    });
  }

  async findAll(negocioId: number) {
    const campanas = await this.prisma.campana.findMany({
      where: {
        negocioId,
        activo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular métricas para cada campaña
    const campanasConMetricas = await Promise.all(
      campanas.map(async (campana) => {
        const transacciones = await this.prisma.transaccion.findMany({
          where: {
            negocioId,
            campanaId: campana.id,
          },
          include: {
            tipo: true
          }
        });

        const registroHoras = await this.prisma.registroHoras.findMany({
          where: {
            negocioId,
            campanaId: campana.id,
            aprobado: true, // Solo contar horas aprobadas
          },
        });

        // Calcular métricas
        const gastoTotalReal = transacciones
          .filter(t => t.tipo?.nombre === 'GASTO')
          .reduce((sum, t) => sum + t.monto, 0);

        const ingresoTotalReal = transacciones
          .filter(t => t.tipo?.nombre === 'INGRESO')
          .reduce((sum, t) => sum + t.monto, 0);

        const horasInvertidas = registroHoras.reduce((sum, rh) => sum + rh.horas, 0);
        const rentabilidadReal = ingresoTotalReal - gastoTotalReal;

        return {
          ...campana,
          horasInvertidas,
          gastoTotalReal,
          ingresoTotalReal,
          rentabilidadReal,
          objetivoIngresos: campana.ingresoTotal,
        };
      })
    );

    return campanasConMetricas;
  }

  async findOne(id: number, negocioId: number) {
    const campana = await this.prisma.campana.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!campana) {
      throw new NotFoundException(`Campaña con ID ${id} no encontrada`);
    }

    return campana;
  }

  async update(id: number, negocioId: number, updateCampanaDto: UpdateCampanaDto) {
    await this.findOne(id, negocioId);

    return this.prisma.campana.update({
      where: { id },
      data: {
        ...(updateCampanaDto.nombre && { nombre: updateCampanaDto.nombre }),
        ...(updateCampanaDto.fechaInicio && { fechaInicio: new Date(updateCampanaDto.fechaInicio) }),
        ...(updateCampanaDto.fechaFin && { fechaFin: new Date(updateCampanaDto.fechaFin) }),
        ...(updateCampanaDto.presupuesto !== undefined && { presupuesto: updateCampanaDto.presupuesto }),
        ...(updateCampanaDto.objetivoIngresos !== undefined && { ingresoTotal: updateCampanaDto.objetivoIngresos }),
        ...(updateCampanaDto.descripcion !== undefined && { descripcion: updateCampanaDto.descripcion }),
        ...(updateCampanaDto.activo !== undefined && { activo: updateCampanaDto.activo }),
      },
    });
  }

  async remove(id: number, negocioId: number) {
    await this.findOne(id, negocioId);

    // Eliminar registros relacionados (solo del mismo negocio)
    await this.prisma.registroHoras.deleteMany({
      where: {
        negocioId,
        campanaId: id,
      },
    });

    await this.prisma.transaccion.deleteMany({
      where: {
        negocioId,
        campanaId: id,
      },
    });

    // Eliminar la campaña
    await this.prisma.campana.delete({
      where: { id },
    });

    return { message: 'Campaña eliminada exitosamente' };
  }

  async getStats(negocioId: number, filters?: any) {
    if (!filters) {
      // Estadísticas generales sin filtros
      const totalCampanas = await this.prisma.campana.count({
        where: {
          negocioId,
          activo: true,
        },
      });

      const campanasActivas = await this.prisma.campana.count({
        where: {
          negocioId,
          activo: true,
          fechaInicio: { lte: new Date() },
          fechaFin: { gte: new Date() },
        },
      });

      const campanasFinalizadas = await this.prisma.campana.count({
        where: {
          negocioId,
          activo: true,
          fechaFin: { lt: new Date() },
        },
      });

      const campanasFuturas = await this.prisma.campana.count({
        where: {
          negocioId,
          activo: true,
          fechaInicio: { gt: new Date() },
        },
      });

      return {
        totalCampanas,
        campanasActivas,
        campanasFinalizadas,
        campanasFuturas,
      };
    }

    // Estadísticas con filtros
    const where: any = {
      negocioId,
    };


    if (filters.usuarioId) {
      where.transacciones = {
        some: {
          negocioId,
          usuarioId: parseInt(filters.usuarioId),
        }
      };
    }

    if (filters.fechaInicio || filters.fechaFin) {
      where.transacciones = {
        ...where.transacciones,
        some: {
          negocioId,
          ...where.transacciones?.some,
          fecha: {
            ...(filters.fechaInicio && { gte: new Date(filters.fechaInicio) }),
            ...(filters.fechaFin && { lte: new Date(filters.fechaFin) })
          }
        }
      };
    }

    const campanas = await this.prisma.campana.findMany({
      where,
      include: {
        transacciones: {
          where: {
            negocioId,
            ...(filters.usuarioId && { usuarioId: parseInt(filters.usuarioId) }),
            ...(filters.fechaInicio || filters.fechaFin) && {
              fecha: {
                ...(filters.fechaInicio && { gte: new Date(filters.fechaInicio) }),
                ...(filters.fechaFin && { lte: new Date(filters.fechaFin) })
              }
            }
          },
          include: {
            tipo: true
          }
        }
      }
    });

    return campanas.map(campana => {
      const ingresos = campana.transacciones
        .filter(t => t.tipo?.nombre === 'INGRESO')
        .reduce((sum, t) => sum + t.monto, 0);

      const gastos = campana.transacciones
        .filter(t => t.tipo?.nombre === 'GASTO')
        .reduce((sum, t) => sum + t.monto, 0);

      const utilidad = ingresos - gastos;

      return {
        id: campana.id,
        nombre: campana.nombre,
        descripcion: campana.descripcion,
        ingresos,
        gastos,
        utilidad,
        totalTransacciones: campana.transacciones.length
      };
    });
  }
}
