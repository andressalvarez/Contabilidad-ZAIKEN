import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistroHorasDto, UpdateRegistroHorasDto } from './dto';
import { HourDebtService } from '../hour-debt/hour-debt.service';
import { DebtDeletionReason } from '@prisma/client';

@Injectable()
export class RegistroHorasService {
  private readonly logger = new Logger(RegistroHorasService.name);

  constructor(
    private prisma: PrismaService,
    private hourDebtService: HourDebtService,
  ) {}

  async create(negocioId: number, createRegistroHorasDto: CreateRegistroHorasDto) {
    // VALIDACIÓN: Límite de 16 horas por registro
    if (createRegistroHorasDto.horas > 16) {
      throw new BadRequestException('El máximo permitido es 16 horas por registro.');
    }

    const usuarioId = createRegistroHorasDto.usuarioId;

    if (!usuarioId) {
      throw new NotFoundException('Debe proporcionar usuarioId');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario || usuario.negocioId !== negocioId) {
      throw new NotFoundException('Usuario no encontrado o no pertenece al negocio');
    }

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
      },
    });

    if (!registroHoras) {
      throw new NotFoundException('Registro de horas no encontrado');
    }

    return registroHoras;
  }

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
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async update(id: number, negocioId: number, updateRegistroHorasDto: UpdateRegistroHorasDto, editorUserId?: number) {
    // Verificar que existe y pertenece al negocio
    const registro = await this.findOne(id, negocioId);

    // SEGURIDAD: No permitir editar registros ya aprobados
    if (registro.aprobado) {
      throw new BadRequestException('No se puede editar un registro ya aprobado. Contacte al administrador.');
    }

    // VALIDACIÓN: Límite de 16 horas por registro
    if (updateRegistroHorasDto.horas !== undefined && updateRegistroHorasDto.horas > 16) {
      throw new BadRequestException('El máximo permitido es 16 horas por registro.');
    }

    const updateData: any = {};

    // Guardar auditoría si se están cambiando las horas
    if (updateRegistroHorasDto.horas !== undefined && updateRegistroHorasDto.horas !== registro.horas) {
      // Solo guardar horasOriginales la primera vez que se edita
      if (registro.horasOriginales === null) {
        updateData.horasOriginales = registro.horas;
      }
      updateData.editadoPor = editorUserId;
      updateData.fechaEdicion = new Date();
    }

    if (updateRegistroHorasDto.usuarioId !== undefined) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: updateRegistroHorasDto.usuarioId },
      });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }
      updateData.usuarioId = updateRegistroHorasDto.usuarioId;
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
      },
    });
  }

  async remove(id: number, negocioId: number) {
    // Verificar que existe y pertenece al negocio
    const registro = await this.findOne(id, negocioId);

    // Rollback debt deductions if record was approved
    if (registro.aprobado) {
      try {
        await this.hourDebtService.rollbackAndRecalculateDebts(
          id,
          negocioId,
          DebtDeletionReason.RECORD_DELETED,
        );
      } catch (error) {
        this.logger.error('Error rolling back debt deductions:', error);
        // Continue with deletion even if rollback fails
      }
    }

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

    const usuariosUnicos = new Set(
      registrosHoras
        .map(r => r.usuarioId)
        .filter(id => id !== null)
    ).size;

    return {
      totalHoras,
      totalRegistros,
      promedioHorasPorDia,
      usuariosActivos: usuariosUnicos,
    };
  }

  // ==================== TIMER METHODS ====================

  async startTimer(negocioId: number, usuarioId: number, campanaId?: number, descripcion?: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, negocioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

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

    return this.prisma.registroHoras.create({
      data: {
        negocioId,
        usuarioId,
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
        campana: true,
      },
    });
  }

  /**
   * Detiene un timer y lo marca como completado
   */
  async stopTimer(
    negocioId: number,
    id: number,
    descripcion?: string,
    timerInicio?: string,
    timerFin?: string
  ) {
    const registro = await this.findOne(id, negocioId);

    if (registro.estado !== 'RUNNING' && registro.estado !== 'PAUSADO') {
      throw new BadRequestException('El timer no está activo');
    }

    let horasFinales = registro.horas;
    let startDate = registro.timerInicio;
    let endDate = new Date();

    // Si se proveen timerInicio y timerFin personalizados, usarlos
    if (timerInicio && timerFin) {
      startDate = new Date(timerInicio);
      endDate = new Date(timerFin);

      // Validar que la fecha de fin sea posterior a la de inicio
      if (endDate <= startDate) {
        throw new BadRequestException('La hora de fin debe ser posterior a la hora de inicio');
      }

      // Recalcular horas basándose en los nuevos tiempos
      horasFinales = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    } else if (registro.estado === 'RUNNING' && startDate) {
      // Comportamiento original: Si está corriendo, calcular tiempo adicional
      const horasTranscurridas = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      horasFinales += horasTranscurridas;
    }

    // Validación: Límite de 16 horas
    if (horasFinales > 16) {
      throw new BadRequestException('El máximo permitido es 16 horas por registro');
    }

    return this.prisma.registroHoras.update({
      where: { id },
      data: {
        estado: 'COMPLETADO',
        timerInicio: startDate,
        timerFin: endDate,
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
        campana: true,
      },
    });
  }

  async getActiveTimer(negocioId: number, usuarioId: number) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, negocioId },
      select: { id: true }
    });

    if (!usuario) {
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
    // Single transaction for approve + debt deduction
    return await this.prisma.$transaction(async (tx) => {
      const registro = await tx.registroHoras.findFirst({
        where: { id, negocioId },
        include: {
          usuario: true,
        },
      });

      if (!registro) {
        throw new NotFoundException(`Registro #${id} no encontrado`);
      }

      if (registro.aprobado) {
        throw new BadRequestException('El registro ya está aprobado');
      }

      if (registro.rechazado) {
        throw new BadRequestException('El registro está rechazado. Elimínelo o edítelo primero.');
      }

      // 1. Approve record
      const approved = await tx.registroHoras.update({
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
          campana: true,
        },
      });

      // 2. Apply debt deduction (within same transaction)
      const targetUserId = approved.usuarioId;
      if (targetUserId) {
        try {
          await this.hourDebtService.applyDebtDeduction(
            negocioId,
            targetUserId,
            approved.id,
            approved.horas,
            approved.fecha,
            tx, // Pass transaction
          );
        } catch (error) {
          this.logger.error('Error applying debt deduction:', error);
          // Don't fail approval if deduction fails
        }
      }

      return approved;
    }, {
      isolationLevel: 'ReadCommitted',
      maxWait: 5000,
      timeout: 10000,
    });
  }

  /**
   * Rechaza un registro de horas
   */
  async reject(negocioId: number, id: number, motivo: string) {
    const registro = await this.findOne(id, negocioId);

    // If was approved, rollback debt deductions first
    if (registro.aprobado) {
      try {
        await this.hourDebtService.rollbackAndRecalculateDebts(
          id,
          negocioId,
          DebtDeletionReason.RECORD_REJECTED,
        );
      } catch (error) {
        this.logger.error('Error rolling back debt deductions:', error);
        // Continue with rejection even if rollback fails
      }
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
        campana: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  // ==================== TIME EDITING METHODS ====================

  /**
   * Actualiza los tiempos de inicio/fin de un registro y recalcula las horas
   * Solo para registros de tipo TIMER que NO están aprobados
   */
  async updateTimerTimes(
    negocioId: number,
    id: number,
    timerInicio?: Date,
    timerFin?: Date,
    editorUserId?: number
  ) {
    const registro = await this.findOne(id, negocioId);

    // Validar que sea un registro de timer
    if (registro.origen !== 'TIMER') {
      throw new BadRequestException('Solo se pueden editar tiempos en registros de tipo TIMER');
    }

    // No permitir editar registros aprobados
    if (registro.aprobado) {
      throw new BadRequestException('No se puede editar un registro ya aprobado');
    }

    const updateData: any = {
      editadoPor: editorUserId,
      fechaEdicion: new Date(),
    };

    // Guardar inicio original la primera vez
    if (timerInicio && !registro.timerInicioOriginal) {
      updateData.timerInicioOriginal = registro.timerInicio;
    }

    // Guardar horas originales la primera vez
    if (!registro.horasOriginales) {
      updateData.horasOriginales = registro.horas;
    }

    // Actualizar tiempos
    if (timerInicio) {
      updateData.timerInicio = timerInicio;
    }
    if (timerFin) {
      updateData.timerFin = timerFin;
    }

    // Recalcular horas basado en los nuevos tiempos
    const inicio = timerInicio || registro.timerInicio;
    const fin = timerFin || registro.timerFin;

    if (inicio && fin) {
      const horasCalculadas = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);

      // Validar que no sea negativo ni exceda 16 horas
      if (horasCalculadas < 0) {
        throw new BadRequestException('La hora de fin debe ser posterior a la hora de inicio');
      }
      if (horasCalculadas > 16) {
        throw new BadRequestException('El máximo permitido es 16 horas por registro');
      }

      updateData.horas = Math.round(horasCalculadas * 100) / 100; // Redondear a 2 decimales
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
        campana: true,
      },
    });
  }

  /**
   * Re-envía un registro rechazado para nueva revisión
   * Limpia el estado de rechazo y lo pone como pendiente
   */
  async resubmit(negocioId: number, id: number) {
    const registro = await this.findOne(id, negocioId);

    if (!registro.rechazado) {
      throw new BadRequestException('Solo se pueden re-enviar registros rechazados');
    }

    if (registro.aprobado) {
      throw new BadRequestException('Este registro ya está aprobado');
    }

    return this.prisma.registroHoras.update({
      where: { id },
      data: {
        rechazado: false,
        motivoRechazo: null,
        // Mantener estado COMPLETADO para que aparezca en pendientes
        estado: 'COMPLETADO',
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
        campana: true,
      },
    });
  }

  /**
   * Obtiene timers "huérfanos" - RUNNING por más de X horas sin actividad
   * Útil para que el admin detecte timers olvidados
   */
  async getOrphanedTimers(negocioId: number, hoursThreshold: number = 12) {
    const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    return this.prisma.registroHoras.findMany({
      where: {
        negocioId,
        estado: 'RUNNING',
        timerInicio: {
          lt: thresholdDate,
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
        campana: true,
      },
      orderBy: {
        timerInicio: 'asc',
      },
    });
  }

  /**
   * Cierra forzadamente un timer (para timers huérfanos)
   * Solo admin debería poder usar esto
   */
  async forceCloseTimer(negocioId: number, id: number, adminUserId: number) {
    const registro = await this.findOne(id, negocioId);

    if (registro.estado !== 'RUNNING' && registro.estado !== 'PAUSADO') {
      throw new BadRequestException('El timer no está activo');
    }

    // Calcular horas hasta ahora
    let horasFinales = registro.horas;
    if (registro.estado === 'RUNNING' && registro.timerInicio) {
      const ahora = new Date();
      const horasTranscurridas = (ahora.getTime() - registro.timerInicio.getTime()) / (1000 * 60 * 60);
      horasFinales += horasTranscurridas;
    }

    // Limitar a 16 horas máximo
    horasFinales = Math.min(horasFinales, 16);

    return this.prisma.registroHoras.update({
      where: { id },
      data: {
        estado: 'COMPLETADO',
        timerFin: new Date(),
        horas: Math.round(horasFinales * 100) / 100,
        descripcion: registro.descripcion
          ? `${registro.descripcion} (Cerrado por admin)`
          : 'Timer cerrado por administrador',
        editadoPor: adminUserId,
        fechaEdicion: new Date(),
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
        campana: true,
      },
    });
  }
}
