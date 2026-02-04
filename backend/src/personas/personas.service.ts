import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Persona, Prisma } from '@prisma/client';
import { CreatePersonaDto, UpdatePersonaDto } from './dto';

@Injectable()
export class PersonasService {
  constructor(private prisma: PrismaService) {}

  // Crear una nueva persona
  async create(negocioId: number, createPersonaDto: CreatePersonaDto): Promise<Persona> {
    try {
      // Verificar que el rol existe
      const rol = await this.prisma.rol.findUnique({
        where: { id: createPersonaDto.rolId },
      });

      if (!rol) {
        throw new BadRequestException(`Rol con ID ${createPersonaDto.rolId} no existe`);
      }

      // Verificar que no exceda el 100% de participación total
      const totalParticipacion = await this.getTotalParticipacion(negocioId);
      if (totalParticipacion + createPersonaDto.participacionPorc > 100) {
        throw new BadRequestException(
          `La participación total excedería el 100%. Actual: ${totalParticipacion}%`
        );
      }

      return await this.prisma.persona.create({
        data: {
          ...createPersonaDto,
          negocioId,
        },
        include: {
          rol: true,
          _count: {
            select: {
              registroHoras: true,
              transacciones: true,
              valorHoras: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una persona con ese nombre');
      }
      throw error;
    }
  }

  // Obtener todas las personas
  async findAll(negocioId: number, includeInactive = false): Promise<Persona[]> {
    const where = includeInactive ? { negocioId } : { negocioId, activo: true };

    return this.prisma.persona.findMany({
      where,
      include: {
        rol: true,
        _count: {
          select: {
            registroHoras: true,
            transacciones: true,
            valorHoras: true,
            distribucionDetalle: true,
          },
        },
      },
      orderBy: [
        { participacionPorc: 'desc' },
        { nombre: 'asc' },
      ],
    });
  }

  // Obtener personas activas
  async findActive(negocioId: number): Promise<Persona[]> {
    return this.findAll(negocioId, false);
  }

  // Obtener persona por ID
  async findOne(id: number, negocioId: number): Promise<Persona> {
    const persona = await this.prisma.persona.findFirst({
      where: {
        id,
        negocioId,
        activo: true,
      },
      include: {
        rol: true,
        valorHoras: {
          where: { activo: true },
          orderBy: { fechaInicio: 'desc' },
          take: 1,
        },
        registroHoras: {
          orderBy: { fecha: 'desc' },
          take: 5,
        },
        transacciones: {
          orderBy: { fecha: 'desc' },
          take: 5,
          include: {
            campana: true,
          },
        },
        _count: {
          select: {
            registroHoras: true,
            transacciones: true,
            valorHoras: true,
            distribucionDetalle: true,
          },
        },
      },
    });

    if (!persona) {
      throw new NotFoundException(`Persona con ID ${id} no encontrada`);
    }

    return persona;
  }

  // Actualizar persona
  async update(id: number, negocioId: number, updatePersonaDto: UpdatePersonaDto): Promise<Persona> {
    try {
      const personaExistente = await this.findOne(id, negocioId);

      // Si se está actualizando la participación, verificar límites
      if (updatePersonaDto.participacionPorc !== undefined) {
        const totalParticipacion = await this.getTotalParticipacion(negocioId, id);
        if (totalParticipacion + updatePersonaDto.participacionPorc > 100) {
          throw new BadRequestException(
            `La participación total excedería el 100%. Actual sin esta persona: ${totalParticipacion}%`
          );
        }
      }

      // Si se está cambiando el rol, verificar que existe
      if (updatePersonaDto.rolId) {
        const rol = await this.prisma.rol.findUnique({
          where: { id: updatePersonaDto.rolId },
        });
        if (!rol) {
          throw new BadRequestException(`Rol con ID ${updatePersonaDto.rolId} no existe`);
        }
      }

      const persona = await this.prisma.persona.update({
        where: { id },
        data: updatePersonaDto,
        include: {
          rol: true,
          _count: {
            select: {
              registroHoras: true,
              transacciones: true,
              valorHoras: true,
            },
          },
        },
      });

      return persona;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Persona con ID ${id} no encontrada`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una persona con ese nombre');
      }
      throw error;
    }
  }

  // Eliminar persona (soft delete)
  async remove(id: number, negocioId: number): Promise<{ message: string }> {
    const persona = await this.findOne(id, negocioId);

    // Verificar si tiene registros asociados
    const hasRecords = await this.hasAssociatedRecords(id);

    if (hasRecords) {
      // Soft delete
      await this.prisma.persona.update({
        where: { id },
        data: { activo: false },
      });
      return { message: `Persona "${persona.nombre}" desactivada (tiene registros asociados)` };
    } else {
      // Hard delete
      await this.prisma.persona.delete({
        where: { id },
      });
      return { message: `Persona "${persona.nombre}" eliminada exitosamente` };
    }
  }

  // Obtener estadísticas de una persona
  async getStats(id: number, negocioId: number) {
    const persona = await this.findOne(id, negocioId);

    // Estadísticas de transacciones
    const transaccionesStats = await this.prisma.transaccion.aggregate({
      where: { personaId: id },
      _sum: {
        monto: true,
      },
      _count: true,
    });

    // Estadísticas de horas
    const horasStats = await this.prisma.registroHoras.aggregate({
      where: { personaId: id },
      _sum: {
        horas: true,
      },
      _count: true,
    });

    // Valor hora actual
    const valorHoraActual = await this.prisma.valorHora.findFirst({
      where: { personaId: id, activo: true },
      orderBy: { fechaInicio: 'desc' },
    });

    // Distribuciones recibidas
    const distribucionesStats = await this.prisma.distribucionDetalle.aggregate({
      where: { personaId: id },
      _sum: {
        montoDistribuido: true,
      },
      _count: true,
    });

    return {
      persona,
      estadisticas: {
        transacciones: {
          total: transaccionesStats._count,
          montoTotal: transaccionesStats._sum.monto || 0,
        },
        horas: {
          registros: horasStats._count,
          horasTotales: horasStats._sum.horas || 0,
        },
        valorHora: valorHoraActual?.valor || 0,
        distribuciones: {
          total: distribucionesStats._count,
          montoRecibido: distribucionesStats._sum.montoDistribuido || 0,
        },
                ingresosPorHora: valorHoraActual
          ? Number(horasStats._sum.horas || 0) * Number(valorHoraActual.valor)
          : 0,
      },
    };
  }

  async getSummary(negocioId: number, filters: any) {
    const where: any = { negocioId };

    if (filters.fechaInicio || filters.fechaFin) {
      where.transacciones = {
        some: {
          fecha: {
            ...(filters.fechaInicio && { gte: new Date(filters.fechaInicio) }),
            ...(filters.fechaFin && { lte: new Date(filters.fechaFin) })
          }
        }
      };
    }

    const personas = await this.prisma.persona.findMany({
      where,
      include: {
        transacciones: {
          where: {
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
        },
        valorHoras: {
          where: {
            ...(filters.fechaInicio || filters.fechaFin) && {
              fechaInicio: {
                ...(filters.fechaInicio && { gte: new Date(filters.fechaInicio) }),
                ...(filters.fechaFin && { lte: new Date(filters.fechaFin) })
              }
            }
          }
        }
      }
    });

    // Cálculos agregados
    const totalPersonas = personas.length;
    const totalParticipacion = personas.reduce((sum, p) => sum + (p.participacionPorc || 0), 0);
    const horasTotales = personas.reduce((sum, p) => sum + (p.horasTotales || 0), 0);
    const aportesTotales = personas.reduce((sum, p) => sum + (p.aportesTotales || 0), 0);
    const inversionTotal = personas.reduce((sum, p) => sum + (p.inversionTotal || 0), 0);
    const valorHoraPromedio = totalPersonas > 0 ? personas.reduce((sum, p) => sum + (p.valorHora || 0), 0) / totalPersonas : 0;
    const participacionPromedio = totalPersonas > 0 ? totalParticipacion / totalPersonas : 0;
    const participacionDisponible = 100 - totalParticipacion;

    return {
      totalPersonas,
      totalParticipacion,
      participacionDisponible,
      horasTotales,
      aportesTotales,
      inversionTotal,
      valorHoraPromedio,
      participacionPromedio
    };
  }

  // Método privado: verificar registros asociados
  private async hasAssociatedRecords(personaId: number): Promise<boolean> {
    const counts = await Promise.all([
      this.prisma.registroHoras.count({ where: { personaId } }),
      this.prisma.transaccion.count({ where: { personaId } }),
      this.prisma.valorHora.count({ where: { personaId } }),
      this.prisma.distribucionDetalle.count({ where: { personaId } }),
    ]);

    return counts.some(count => count > 0);
  }

  // Método privado: obtener participación total
  /**
   * Vincular una persona con un usuario
   */
  async vincularUsuario(personaId: number, negocioId: number, usuarioId: number) {
    // Verificar que la persona existe y pertenece al negocio
    const persona = await this.findOne(personaId, negocioId);
    if (!persona) {
      throw new NotFoundException(`Persona con ID ${personaId} no encontrada`);
    }

    // Verificar que el usuario existe y pertenece al mismo negocio
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        negocioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado o no pertenece al mismo negocio`);
    }

    // Actualizar la persona con el usuarioId
    return this.prisma.persona.update({
      where: { id: personaId },
      data: { usuarioId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        rol: true,
      },
    });
  }

  private async getTotalParticipacion(negocioId: number, excludePersonaId?: number): Promise<number> {
    const where = excludePersonaId
      ? { negocioId, activo: true, NOT: { id: excludePersonaId } }
      : { negocioId, activo: true };

    const result = await this.prisma.persona.aggregate({
      where,
      _sum: {
        participacionPorc: true,
      },
    });

    return Number(result._sum.participacionPorc || 0);
  }
}
