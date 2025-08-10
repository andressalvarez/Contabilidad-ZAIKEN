import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistribucionUtilidadesDto } from './dto/create-distribucion-utilidades.dto';
import { UpdateDistribucionUtilidadesDto } from './dto/update-distribucion-utilidades.dto';

@Injectable()
export class DistribucionUtilidadesService {
  constructor(private prisma: PrismaService) {}

  async create(createDistribucionUtilidadesDto: CreateDistribucionUtilidadesDto) {
    const distribucion = await this.prisma.distribucionUtilidades.create({
      data: {
        periodo: createDistribucionUtilidadesDto.periodo,
        fecha: new Date(createDistribucionUtilidadesDto.fecha),
        utilidadTotal: createDistribucionUtilidadesDto.utilidadTotal,
        estado: createDistribucionUtilidadesDto.estado || 'Pendiente',
      },
      include: {
        detalles: {
          include: {
            persona: true,
          },
        },
      },
    });

    return { data: distribucion };
  }

  async findAll() {
    const distribuciones = await this.prisma.distribucionUtilidades.findMany({
      include: {
        detalles: {
          include: {
            persona: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { data: distribuciones };
  }

  async findOne(id: number) {
    const distribucion = await this.prisma.distribucionUtilidades.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            persona: true,
          },
        },
      },
    });

    if (!distribucion) {
      throw new NotFoundException(`Distribución con ID ${id} no encontrada`);
    }

    return { data: distribucion };
  }

  async update(id: number, updateDistribucionUtilidadesDto: UpdateDistribucionUtilidadesDto) {
    const distribucion = await this.prisma.distribucionUtilidades.update({
      where: { id },
      data: {
        ...(updateDistribucionUtilidadesDto.periodo && { periodo: updateDistribucionUtilidadesDto.periodo }),
        ...(updateDistribucionUtilidadesDto.fecha && { fecha: new Date(updateDistribucionUtilidadesDto.fecha) }),
        ...(updateDistribucionUtilidadesDto.utilidadTotal && { utilidadTotal: updateDistribucionUtilidadesDto.utilidadTotal }),
        ...(updateDistribucionUtilidadesDto.estado && { estado: updateDistribucionUtilidadesDto.estado }),
      },
      include: {
        detalles: {
          include: {
            persona: true,
          },
        },
      },
    });

    return { data: distribucion };
  }

  async remove(id: number) {
    // Eliminar detalles primero
    await this.prisma.distribucionDetalle.deleteMany({
      where: { distribucionId: id },
    });

    // Eliminar distribución
    await this.prisma.distribucionUtilidades.delete({
      where: { id },
    });

    return { message: 'Distribución eliminada exitosamente' };
  }

  async getStats() {
    const [
      totalDistribuciones,
      totalUtilidades,
      totalDistribuido,
      distribucionesPendientes,
      distribucionesCompletadas,
      personasActivas,
    ] = await Promise.all([
      this.prisma.distribucionUtilidades.count(),
      this.prisma.distribucionUtilidades.aggregate({
        _sum: { utilidadTotal: true },
      }),
      this.prisma.distribucionDetalle.aggregate({
        _sum: { montoDistribuido: true },
      }),
      this.prisma.distribucionUtilidades.count({
        where: { estado: 'Pendiente' },
      }),
      this.prisma.distribucionUtilidades.count({
        where: { estado: 'Distribuida' },
      }),
      this.prisma.persona.count({
        where: { activo: true },
      }),
    ]);

    const promedioPorPersona = personasActivas > 0
      ? (totalDistribuido._sum.montoDistribuido || 0) / personasActivas
      : 0;

    return {
      data: {
        totalDistribuciones,
        totalUtilidades: totalUtilidades._sum.utilidadTotal || 0,
        totalDistribuido: totalDistribuido._sum.montoDistribuido || 0,
        distribucionesPendientes,
        distribucionesCompletadas,
        promedioPorPersona,
      },
    };
  }

  async distribuirAutomaticamente(id: number) {
    // Obtener la distribución
    const distribucion = await this.prisma.distribucionUtilidades.findUnique({
      where: { id },
    });

    if (!distribucion) {
      throw new NotFoundException(`Distribución con ID ${id} no encontrada`);
    }

    // Obtener personas activas
    const personas = await this.prisma.persona.findMany({
      where: { activo: true },
      include: { rol: true },
    });

    if (personas.length === 0) {
      throw new Error('No hay personas activas para distribuir utilidades');
    }

    // Calcular distribución basada en participación
    const totalParticipacion = personas.reduce((acc, persona) => acc + persona.participacionPorc, 0);

    if (totalParticipacion === 0) {
      throw new Error('No hay participación definida para las personas');
    }

    // Crear detalles de distribución
    const detalles = personas.map(persona => {
      const porcentaje = persona.participacionPorc / totalParticipacion;
      const montoDistribuido = distribucion.utilidadTotal * porcentaje;

      return {
        distribucionId: id,
        personaId: persona.id,
        porcentajeParticipacion: porcentaje * 100,
        montoDistribuido,
      };
    });

    // Eliminar detalles existentes
    await this.prisma.distribucionDetalle.deleteMany({
      where: { distribucionId: id },
    });

    // Crear nuevos detalles
    await this.prisma.distribucionDetalle.createMany({
      data: detalles,
    });

    // Actualizar estado de la distribución
    await this.prisma.distribucionUtilidades.update({
      where: { id },
      data: { estado: 'Distribuida' },
    });

    return { message: 'Utilidades distribuidas automáticamente' };
  }
}
