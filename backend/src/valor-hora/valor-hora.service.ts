import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateValorHoraDto, UpdateValorHoraDto } from './dto';

@Injectable()
export class ValorHoraService {
  constructor(private prisma: PrismaService) {}

  async create(negocioId: number, createValorHoraDto: CreateValorHoraDto) {
    // Obtener el rol de la persona
    const persona = await this.prisma.persona.findUnique({
      where: { id: createValorHoraDto.personaId },
      include: { rol: true }
    });

    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }

    return this.prisma.valorHora.create({
      data: {
        negocioId,
        personaId: createValorHoraDto.personaId,
        rolId: persona.rolId,
        valor: createValorHoraDto.valor,
        fechaInicio: new Date(createValorHoraDto.fechaInicio),
        notas: createValorHoraDto.notas,
      },
      include: {
        persona: true,
        rol: true,
      },
    });
  }

  async findAll(negocioId: number) {
    return this.prisma.valorHora.findMany({
      where: { negocioId },
      include: {
        persona: true,
        rol: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, negocioId: number) {
    const valorHora = await this.prisma.valorHora.findFirst({
      where: {
        id,
        negocioId,
      },
      include: {
        persona: true,
        rol: true,
      },
    });

    if (!valorHora) {
      throw new NotFoundException('Valor por hora no encontrado');
    }

    return valorHora;
  }

  async findByPersonaId(personaId: number, negocioId: number) {
    return this.prisma.valorHora.findMany({
      where: {
        personaId,
        negocioId,
      },
      include: {
        persona: true,
        rol: true,
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });
  }

  async update(id: number, negocioId: number, updateValorHoraDto: UpdateValorHoraDto) {
    // Verificar que existe y pertenece al negocio
    await this.findOne(id, negocioId);

    const updateData: any = {};

    if (updateValorHoraDto.valor !== undefined) {
      updateData.valor = updateValorHoraDto.valor;
    }

    if (updateValorHoraDto.fechaInicio !== undefined) {
      updateData.fechaInicio = new Date(updateValorHoraDto.fechaInicio);
    }

    if (updateValorHoraDto.notas !== undefined) {
      updateData.notas = updateValorHoraDto.notas;
    }

    return this.prisma.valorHora.update({
      where: { id },
      data: updateData,
      include: {
        persona: true,
        rol: true,
      },
    });
  }

  async remove(id: number, negocioId: number) {
    // Verificar que existe y pertenece al negocio
    await this.findOne(id, negocioId);

    return this.prisma.valorHora.delete({
      where: { id },
    });
  }

  async getStats(negocioId: number) {
    const valoresHora = await this.prisma.valorHora.findMany({
      where: {
        negocioId,
        activo: true,
      },
    });

    const valores = valoresHora.map(vh => vh.valor);
    const valorPromedio = valores.length > 0
      ? valores.reduce((sum, val) => sum + val, 0) / valores.length
      : 0;
    const valorMaximo = valores.length > 0 ? Math.max(...valores) : 0;
    const personasConValor = new Set(valoresHora.map(vh => vh.personaId)).size;

    return {
      valorPromedio,
      valorMaximo,
      personasConValor,
      totalValores: valoresHora.length,
    };
  }
}






