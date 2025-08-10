import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistroHorasDto, UpdateRegistroHorasDto } from './dto';

@Injectable()
export class RegistroHorasService {
  constructor(private prisma: PrismaService) {}

  async create(createRegistroHorasDto: CreateRegistroHorasDto) {
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

  async findAll() {
    return this.prisma.registroHoras.findMany({
      include: {
        persona: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const registroHoras = await this.prisma.registroHoras.findUnique({
      where: { id },
      include: {
        persona: true,
      },
    });

    if (!registroHoras) {
      throw new NotFoundException('Registro de horas no encontrado');
    }

    return registroHoras;
  }

  async findByPersonaId(personaId: number) {
    return this.prisma.registroHoras.findMany({
      where: { personaId },
      include: {
        persona: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async update(id: number, updateRegistroHorasDto: UpdateRegistroHorasDto) {
    // Verificar que existe
    await this.findOne(id);

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

  async remove(id: number) {
    // Verificar que existe
    await this.findOne(id);

    return this.prisma.registroHoras.delete({
      where: { id },
    });
  }

  async getStats() {
    const registrosHoras = await this.prisma.registroHoras.findMany({
      where: { aprobado: true },
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
}
