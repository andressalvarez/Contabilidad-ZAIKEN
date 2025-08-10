import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateValorHoraDto, UpdateValorHoraDto } from './dto';

@Injectable()
export class ValorHoraService {
  constructor(private prisma: PrismaService) {}

  async create(createValorHoraDto: CreateValorHoraDto) {
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

  async findAll() {
    return this.prisma.valorHora.findMany({
      include: {
        persona: true,
        rol: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const valorHora = await this.prisma.valorHora.findUnique({
      where: { id },
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

  async findByPersonaId(personaId: number) {
    return this.prisma.valorHora.findMany({
      where: { personaId },
      include: {
        persona: true,
        rol: true,
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });
  }

  async update(id: number, updateValorHoraDto: UpdateValorHoraDto) {
    // Verificar que existe
    await this.findOne(id);

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

  async remove(id: number) {
    // Verificar que existe
    await this.findOne(id);

    return this.prisma.valorHora.delete({
      where: { id },
    });
  }

  async getStats() {
    const valoresHora = await this.prisma.valorHora.findMany({
      where: { activo: true },
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






