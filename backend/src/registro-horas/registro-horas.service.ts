import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistroHorasDto, UpdateRegistroHorasDto } from './dto';

@Injectable()
export class RegistroHorasService {
  constructor(private prisma: PrismaService) {}

  async create(negocioId: number, createRegistroHorasDto: CreateRegistroHorasDto) {
    // ✅ Priorizar usuarioId si está presente, sino usar personaId (compatibilidad)
    let usuarioId = createRegistroHorasDto.usuarioId;
    let personaId = createRegistroHorasDto.personaId;

    if (!usuarioId && personaId) {
      // Obtener usuarioId desde persona (compatibilidad backward)
      const persona = await this.prisma.persona.findUnique({
        where: { id: personaId },
        select: { usuarioId: true }
      });
      usuarioId = persona?.usuarioId;
    }

    if (!usuarioId) {
      throw new NotFoundException('Usuario no encontrado para el registro de horas');
    }

    // Verificar que el usuario existe y pertenece al negocio
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario || usuario.negocioId !== negocioId) {
      throw new NotFoundException('Usuario no encontrado o no pertenece al negocio');
    }

    // Verificar que la campaña existe si se proporciona
    if (createRegistroHorasDto.campanaId) {
      const campana = await this.prisma.campana.findUnique({
        where: { id: createRegistroHorasDto.campanaId }
      });

      if (!campana) {
        throw new NotFoundException('Campaña no encontrada');
      }
    }

    return this.prisma.registroHoras.create({
      data: {
        negocioId,
        usuarioId,
        personaId, // Mantener para compatibilidad
        campanaId: createRegistroHorasDto.campanaId,
        fecha: new Date(createRegistroHorasDto.fecha),
        horas: createRegistroHorasDto.horas,
        descripcion: createRegistroHorasDto.descripcion,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
      },
    });
  }

  async findAll(negocioId: number) {
    return this.prisma.registroHoras.findMany({
      where: {
        negocioId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findOne(id: number, negocioId: number) {
    const registroHoras = await this.prisma.registroHoras.findFirst({
      where: {
        id,
        negocioId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
      },
    });

    if (!registroHoras) {
      throw new NotFoundException('Registro de horas no encontrado');
    }

    return registroHoras;
  }

  async findByPersonaId(negocioId: number, personaId: number) {
    return this.prisma.registroHoras.findMany({
      where: {
        negocioId,
        personaId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  /**
   * ✅ Nuevo método para buscar por usuarioId
   */
  async findByUsuarioId(negocioId: number, usuarioId: number) {
    return this.prisma.registroHoras.findMany({
      where: {
        negocioId,
        usuarioId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async update(id: number, negocioId: number, updateRegistroHorasDto: UpdateRegistroHorasDto) {
    // Verificar que existe y pertenece al negocio
    await this.findOne(id, negocioId);

    const updateData: any = {};

    // ✅ Priorizar usuarioId, actualizar personaId si es necesario
    if (updateRegistroHorasDto.usuarioId !== undefined) {
      updateData.usuarioId = updateRegistroHorasDto.usuarioId;

      // Sincronizar personaId desde usuarioId (para compatibilidad)
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: updateRegistroHorasDto.usuarioId },
        include: { personas: { take: 1 } }
      });
      if (usuario?.personas?.[0]) {
        updateData.personaId = usuario.personas[0].id;
      }
    } else if (updateRegistroHorasDto.personaId !== undefined) {
      updateData.personaId = updateRegistroHorasDto.personaId;

      // Sincronizar usuarioId desde personaId (backward compatibility)
      const persona = await this.prisma.persona.findUnique({
        where: { id: updateRegistroHorasDto.personaId },
        select: { usuarioId: true }
      });
      if (persona?.usuarioId) {
        updateData.usuarioId = persona.usuarioId;
      }
    }

    if (updateRegistroHorasDto.campanaId !== undefined) {
      updateData.campanaId = updateRegistroHorasDto.campanaId;
    }

    if (updateRegistroHorasDto.fecha !== undefined) {
      updateData.fecha = new Date(updateRegistroHorasDto.fecha);
    }

    if (updateRegistroHorasDto.horas !== undefined) {
      updateData.horas = updateRegistroHorasDto.horas;
    }

    if (updateRegistroHorasDto.descripcion !== undefined) {
      updateData.descripcion = updateRegistroHorasDto.descripcion;
    }

    return this.prisma.registroHoras.update({
      where: { id },
      data: updateData,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
      },
    });
  }

  async remove(id: number, negocioId: number) {
    // Verificar que existe y pertenece al negocio
    await this.findOne(id, negocioId);

    return this.prisma.registroHoras.delete({
      where: { id },
    });
  }

  async getStats(negocioId: number) {
    const registrosHoras = await this.prisma.registroHoras.findMany({
      where: {
        negocioId,
        aprobado: true,
      },
    });

    const totalHoras = registrosHoras.reduce((sum, registro) => sum + registro.horas, 0);
    const totalRegistros = registrosHoras.length;
    const promedioHorasPorDia = totalRegistros > 0 ? totalHoras / totalRegistros : 0;

    // ✅ Contar usuarios únicos que tienen registros (priorizar usuarioId)
    const usuariosUnicos = new Set(
      registrosHoras
        .map(r => r.usuarioId || r.personaId) // Usar usuarioId, fallback a personaId
        .filter(id => id !== null)
    ).size;

    return {
      totalHoras,
      totalRegistros,
      promedioHorasPorDia,
      personasActivas: usuariosUnicos, // Ahora cuenta usuarios únicos
    };
  }

  // ==================== TIMER METHODS ====================

  /**
   * Inicia un timer para un usuario
   * @param usuarioId - ID del usuario (puede recibir personaId como fallback)
   */
  async startTimer(negocioId: number, usuarioIdOrPersonaId: number, campanaId?: number, descripcion?: string) {
    // ✅ Determinar si es usuarioId o personaId
    let usuarioId: number;
    let personaId: number | undefined;

    // Intentar como usuarioId primero
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioIdOrPersonaId, negocioId },
      include: { personas: { take: 1 } }
    });

    if (usuario) {
      usuarioId = usuario.id;
      personaId = usuario.personas?.[0]?.id; // Para compatibilidad
    } else {
      // Intentar como personaId (backward compatibility)
      const persona = await this.prisma.persona.findFirst({
        where: { id: usuarioIdOrPersonaId, negocioId },
        select: { usuarioId: true, id: true }
      });

      if (!persona || !persona.usuarioId) {
        throw new NotFoundException('Usuario no encontrado');
      }

      usuarioId = persona.usuarioId;
      personaId = persona.id;
    }

    // Verificar que no hay un timer activo para este usuario
    const timerActivo = await this.prisma.registroHoras.findFirst({
      where: {
        negocioId,
        usuarioId,
        estado: 'RUNNING',
      },
    });

    if (timerActivo) {
      throw new BadRequestException('Ya existe un timer activo para este usuario');
    }

    // Crear nuevo registro con timer
    return this.prisma.registroHoras.create({
      data: {
        negocioId,
        usuarioId,
        personaId, // Mantener para compatibilidad
        campanaId,
        fecha: new Date(),
        horas: 0,
        descripcion: descripcion || 'Registro desde timer',
        origen: 'TIMER',
        timerInicio: new Date(),
        estado: 'RUNNING',
        aprobado: false,
        rechazado: false,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
        campana: true,
      },
    });
  }

  /**
   * Pausa un timer activo
   */
  async pauseTimer(negocioId: number, id: number) {
    const registro = await this.findOne(id, negocioId);

    if (registro.estado !== 'RUNNING') {
      throw new BadRequestException('El timer no está en ejecución');
    }

    if (!registro.timerInicio) {
      throw new BadRequestException('No hay hora de inicio registrada');
    }

    // Calcular horas transcurridas hasta ahora
    const ahora = new Date();
    const horasTranscurridas = (ahora.getTime() - registro.timerInicio.getTime()) / (1000 * 60 * 60);

    return this.prisma.registroHoras.update({
      where: { id },
      data: {
        estado: 'PAUSADO',
        horas: registro.horas + horasTranscurridas,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
        campana: true,
      },
    });
  }

  /**
   * Reanuda un timer pausado
   */
  async resumeTimer(negocioId: number, id: number) {
    const registro = await this.findOne(id, negocioId);

    if (registro.estado !== 'PAUSADO') {
      throw new BadRequestException('El timer no está pausado');
    }

    return this.prisma.registroHoras.update({
      where: { id },
      data: {
        estado: 'RUNNING',
        timerInicio: new Date(),
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
        campana: true,
      },
    });
  }

  /**
   * Detiene un timer y lo marca como completado
   */
  async stopTimer(negocioId: number, id: number, descripcion?: string) {
    const registro = await this.findOne(id, negocioId);

    if (registro.estado !== 'RUNNING' && registro.estado !== 'PAUSADO') {
      throw new BadRequestException('El timer no está activo');
    }

    let horasFinales = registro.horas;

    // Si está corriendo, calcular tiempo adicional
    if (registro.estado === 'RUNNING' && registro.timerInicio) {
      const ahora = new Date();
      const horasTranscurridas = (ahora.getTime() - registro.timerInicio.getTime()) / (1000 * 60 * 60);
      horasFinales += horasTranscurridas;
    }

    return this.prisma.registroHoras.update({
      where: { id },
      data: {
        estado: 'COMPLETADO',
        timerFin: new Date(),
        horas: horasFinales,
        ...(descripcion && { descripcion }),
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
        campana: true,
      },
    });
  }

  /**
   * Obtiene el timer activo de un usuario
   * @param usuarioIdOrPersonaId - ID del usuario (puede recibir personaId como fallback)
   */
  async getActiveTimer(negocioId: number, usuarioIdOrPersonaId: number) {
    // ✅ Determinar si es usuarioId o personaId
    let usuarioId: number | undefined;

    // Intentar como usuarioId primero
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioIdOrPersonaId, negocioId },
      select: { id: true }
    });

    if (usuario) {
      usuarioId = usuario.id;
    } else {
      // Intentar como personaId (backward compatibility)
      const persona = await this.prisma.persona.findFirst({
        where: { id: usuarioIdOrPersonaId, negocioId },
        select: { usuarioId: true }
      });
      usuarioId = persona?.usuarioId || undefined;
    }

    if (!usuarioId) {
      return null;
    }

    return this.prisma.registroHoras.findFirst({
      where: {
        negocioId,
        usuarioId,
        estado: {
          in: ['RUNNING', 'PAUSADO'],
        },
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
        campana: true,
      },
    });
  }

  /**
   * Cancela un timer (lo elimina)
   */
  async cancelTimer(negocioId: number, id: number) {
    const registro = await this.findOne(id, negocioId);

    if (registro.estado === 'COMPLETADO') {
      throw new BadRequestException('No se puede cancelar un timer completado');
    }

    return this.prisma.registroHoras.delete({
      where: { id },
    });
  }

  // ==================== APPROVAL METHODS ====================

  /**
   * Aprueba un registro de horas
   */
  async approve(negocioId: number, id: number, userId: number) {
    const registro = await this.findOne(id, negocioId);

    if (registro.aprobado) {
      throw new BadRequestException('El registro ya está aprobado');
    }

    if (registro.rechazado) {
      throw new BadRequestException('El registro está rechazado. Elimínelo o edítelo primero.');
    }

    return this.prisma.registroHoras.update({
      where: { id },
      data: {
        aprobado: true,
        aprobadoPor: userId,
        fechaAprobacion: new Date(),
        rechazado: false,
        motivoRechazo: null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
        campana: true,
      },
    });
  }

  /**
   * Rechaza un registro de horas
   */
  async reject(negocioId: number, id: number, motivo: string) {
    const registro = await this.findOne(id, negocioId);

    if (registro.aprobado) {
      throw new BadRequestException('No se puede rechazar un registro ya aprobado');
    }

    return this.prisma.registroHoras.update({
      where: { id },
      data: {
        rechazado: true,
        motivoRechazo: motivo,
        aprobado: false,
        aprobadoPor: null,
        fechaAprobacion: null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
        campana: true,
      },
    });
  }

  /**
   * Obtiene todos los registros pendientes de aprobación
   */
  async getPending(negocioId: number) {
    return this.prisma.registroHoras.findMany({
      where: {
        negocioId,
        aprobado: false,
        rechazado: false,
        estado: 'COMPLETADO', // Solo mostrar los completados
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
        campana: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  /**
   * Obtiene todos los registros rechazados
   */
  async getRejected(negocioId: number) {
    return this.prisma.registroHoras.findMany({
      where: {
        negocioId,
        rechazado: true,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rolNegocio: {
              select: {
                id: true,
                nombreRol: true,
              },
            },
          },
        },
        persona: true, // Mantener para compatibilidad
        campana: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }
}
