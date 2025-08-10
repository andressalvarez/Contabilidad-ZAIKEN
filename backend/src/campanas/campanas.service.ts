import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampanaDto, UpdateCampanaDto } from './dto';

@Injectable()
export class CampanasService {
  constructor(private prisma: PrismaService) {}

  async create(createCampanaDto: CreateCampanaDto) {
    return this.prisma.campana.create({
      data: {
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

  async findAll() {
    const campanas = await this.prisma.campana.findMany({
      where: { activo: true },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular métricas para cada campaña
    const campanasConMetricas = await Promise.all(
      campanas.map(async (campana) => {
        const transacciones = await this.prisma.transaccion.findMany({
          where: { campanaId: campana.id },
          include: {
            tipo: true
          }
        });

        const registroHoras = await this.prisma.registroHoras.findMany({
          where: { campanaId: campana.id },
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

  async findOne(id: number) {
    const campana = await this.prisma.campana.findUnique({
      where: { id },
    });

    if (!campana) {
      throw new NotFoundException(`Campaña con ID ${id} no encontrada`);
    }

    return campana;
  }

  async update(id: number, updateCampanaDto: UpdateCampanaDto) {
    const campana = await this.findOne(id);

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

  async remove(id: number) {
    const campana = await this.findOne(id);

    // Eliminar registros relacionados
    await this.prisma.registroHoras.deleteMany({
      where: { campanaId: id },
    });

    await this.prisma.transaccion.deleteMany({
      where: { campanaId: id },
    });

    // Eliminar la campaña
    await this.prisma.campana.delete({
      where: { id },
    });

    return { message: 'Campaña eliminada exitosamente' };
  }

  async getStats(filters?: any) {
    if (!filters) {
      // Estadísticas generales sin filtros
      const totalCampanas = await this.prisma.campana.count({
        where: { activo: true },
      });

      const campanasActivas = await this.prisma.campana.count({
        where: {
          activo: true,
          fechaInicio: { lte: new Date() },
          fechaFin: { gte: new Date() },
        },
      });

      const campanasFinalizadas = await this.prisma.campana.count({
        where: {
          activo: true,
          fechaFin: { lt: new Date() },
        },
      });

      const campanasFuturas = await this.prisma.campana.count({
        where: {
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
    const where: any = {};

    if (filters.personaId) {
      where.transacciones = {
        some: {
          personaId: parseInt(filters.personaId)
        }
      };
    }

    if (filters.fechaInicio || filters.fechaFin) {
      where.transacciones = {
        ...where.transacciones,
        some: {
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
            ...(filters.personaId && { personaId: parseInt(filters.personaId) }),
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
