import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistroHorasDto, UpdateRegistroHorasDto } from './dto';

@Injectable()
export class RegistroHorasService {
  constructor(private prisma: PrismaService) {}

  async create(negocioId: number, createRegistroHorasDto: CreateRegistroHorasDto) {
    // Verificar que la persona existe
    const persona = await this.prisma.persona.findUnique({
      where: { id: createRegistroHorasDto.personaId }
    });

    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
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
        personaId: createRegistroHorasDto.personaId,
        campanaId: createRegistroHorasDto.campanaId,
        fecha: new Date(createRegistroHorasDto.fecha),
        horas: createRegistroHorasDto.horas,
        descripcion: createRegistroHorasDto.descripcion,
      },
      include: {
        persona: true,
      },
    });
  }

  async findAll(negocioId: number) {
    return this.prisma.registroHoras.findMany({
      where: {
        negocioId,
      },
      include: {
        persona: true,
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
        persona: true,
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
        persona: true,
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

    if (updateRegistroHorasDto.personaId !== undefined) {
      updateData.personaId = updateRegistroHorasDto.personaId;
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
        persona: true,
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

    // Contar personas únicas que tienen registros
    const personasUnicas = new Set(registrosHoras.map(r => r.personaId)).size;

    return {
      totalHoras,
      totalRegistros,
      promedioHorasPorDia,
      personasActivas: personasUnicas,
    };
  }

  // ==================== TIMER METHODS ====================

  /**
   * Inicia un timer para una persona
   */
  async startTimer(negocioId: number, personaId: number, campanaId?: number, descripcion?: string) {
    // Verificar que no hay un timer activo para esta persona
    const timerActivo = await this.prisma.registroHoras.findFirst({
      where: {
        negocioId,
        personaId,
        estado: 'RUNNING',
      },
    });

    if (timerActivo) {
      throw new BadRequestException('Ya existe un timer activo para esta persona');
    }

    // Crear nuevo registro con timer
    return this.prisma.registroHoras.create({
      data: {
        negocioId,
        personaId,
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
        persona: true,
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
        persona: true,
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
        persona: true,
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
        persona: true,
        campana: true,
      },
    });
  }

  /**
   * Obtiene el timer activo de una persona
   */
  async getActiveTimer(negocioId: number, personaId: number) {
    return this.prisma.registroHoras.findFirst({
      where: {
        negocioId,
        personaId,
        estado: {
          in: ['RUNNING', 'PAUSADO'],
        },
      },
      include: {
        persona: true,
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
        persona: true,
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
        persona: true,
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
        persona: true,
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
        persona: true,
        campana: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }
}
