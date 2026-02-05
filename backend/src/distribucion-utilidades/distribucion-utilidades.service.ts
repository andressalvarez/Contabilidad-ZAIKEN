import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistribucionUtilidadesDto } from './dto/create-distribucion-utilidades.dto';
import { UpdateDistribucionUtilidadesDto } from './dto/update-distribucion-utilidades.dto';

@Injectable()
export class DistribucionUtilidadesService {
  constructor(private prisma: PrismaService) {}

  async create(negocioId: number, createDistribucionUtilidadesDto: CreateDistribucionUtilidadesDto) {
    const distribucion = await this.prisma.distribucionUtilidades.create({
      data: {
        negocioId,
        periodo: createDistribucionUtilidadesDto.periodo,
        fecha: new Date(createDistribucionUtilidadesDto.fecha),
        utilidadTotal: createDistribucionUtilidadesDto.utilidadTotal,
        estado: createDistribucionUtilidadesDto.estado || 'Pendiente',
      },
      include: {
        detalles: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                participacionPorc: true,
                rolNegocio: {
                  select: {
                    id: true,
                    nombreRol: true,
                  },
                },
              },
            },
            persona: true,
          },
        },
      },
    });

    return { data: distribucion };
  }

  async findAll(negocioId: number) {
    const distribuciones = await this.prisma.distribucionUtilidades.findMany({
      where: {
        negocioId,
      },
      include: {
        detalles: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                participacionPorc: true,
                rolNegocio: {
                  select: {
                    id: true,
                    nombreRol: true,
                  },
                },
              },
            },
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

  async findOne(id: number, negocioId: number) {
    const distribucion = await this.prisma.distribucionUtilidades.findFirst({
      where: {
        id,
        negocioId,
      },
      include: {
        detalles: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                participacionPorc: true,
                rolNegocio: {
                  select: {
                    id: true,
                    nombreRol: true,
                  },
                },
              },
            },
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

  async update(id: number, negocioId: number, updateDistribucionUtilidadesDto: UpdateDistribucionUtilidadesDto) {
    await this.findOne(id, negocioId);

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
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                participacionPorc: true,
                rolNegocio: {
                  select: {
                    id: true,
                    nombreRol: true,
                  },
                },
              },
            },
            persona: true,
          },
        },
      },
    });

    return { data: distribucion };
  }

  async remove(id: number, negocioId: number) {
    await this.findOne(id, negocioId);

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

  async getStats(negocioId: number) {
    const [
      totalDistribuciones,
      totalUtilidades,
      totalDistribuido,
      distribucionesPendientes,
      distribucionesCompletadas,
      usuariosActivos,
    ] = await Promise.all([
      this.prisma.distribucionUtilidades.count({
        where: { negocioId },
      }),
      this.prisma.distribucionUtilidades.aggregate({
        where: { negocioId },
        _sum: { utilidadTotal: true },
      }),
      this.prisma.distribucionDetalle.aggregate({
        where: {
          distribucion: {
            negocioId,
          },
        },
        _sum: { montoDistribuido: true },
      }),
      this.prisma.distribucionUtilidades.count({
        where: {
          negocioId,
          estado: 'Pendiente',
        },
      }),
      this.prisma.distribucionUtilidades.count({
        where: {
          negocioId,
          estado: 'Distribuida',
        },
      }),

      this.prisma.usuario.count({
        where: {
          negocioId,
          activo: true,
          participacionPorc: { gt: 0 },
        },
      }),
    ]);

    const promedioPorUsuario = usuariosActivos > 0
      ? (totalDistribuido._sum.montoDistribuido || 0) / usuariosActivos
      : 0;

    return {
      data: {
        totalDistribuciones,
        totalUtilidades: totalUtilidades._sum.utilidadTotal || 0,
        totalDistribuido: totalDistribuido._sum.montoDistribuido || 0,
        distribucionesPendientes,
        distribucionesCompletadas,
        promedioPorPersona: promedioPorUsuario,
      },
    };
  }

  async distribuirAutomaticamente(id: number, negocioId: number) {
    // Obtener la distribución
    const distribucion = await this.prisma.distribucionUtilidades.findFirst({
      where: {
        id,
        negocioId,
      },
    });

    if (!distribucion) {
      throw new NotFoundException(`Distribución con ID ${id} no encontrada`);
    }

    const usuarios = await this.prisma.usuario.findMany({
      where: {
        negocioId,
        activo: true,
        participacionPorc: { gt: 0 },
      },
      include: {
        rolNegocio: true,
        personas: { take: 1 },
      },
    });

    if (usuarios.length === 0) {
      throw new Error('No hay usuarios activos con participación para distribuir utilidades');
    }

    const totalParticipacion = usuarios.reduce((acc, usuario) => acc + usuario.participacionPorc, 0);

    if (totalParticipacion === 0) {
      throw new Error('No hay participación definida para los usuarios');
    }

    const detalles = usuarios.map(usuario => {
      const porcentaje = usuario.participacionPorc / totalParticipacion;
      const montoDistribuido = distribucion.utilidadTotal * porcentaje;

      return {
        distribucionId: id,
        usuarioId: usuario.id,
        personaId: usuario.personas[0]?.id,
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
