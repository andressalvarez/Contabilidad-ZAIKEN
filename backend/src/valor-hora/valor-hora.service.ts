import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateValorHoraDto, UpdateValorHoraDto } from './dto';

@Injectable()
export class ValorHoraService {
  constructor(private prisma: PrismaService) {}

  async create(negocioId: number, createValorHoraDto: CreateValorHoraDto) {
    const usuarioId = createValorHoraDto.usuarioId;

    if (!usuarioId) {
      throw new NotFoundException('Debe proporcionar usuarioId');
    }

    // Verify user exists and get their role
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, negocioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!usuario.rolId) {
      throw new NotFoundException('El usuario no tiene un rol asignado');
    }

    return this.prisma.valorHora.create({
      data: {
        negocioId,
        usuarioId,
        rolId: usuario.rolId,
        valor: createValorHoraDto.valor,
        fechaInicio: new Date(createValorHoraDto.fechaInicio),
        notas: createValorHoraDto.notas,
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
        rol: true,
      },
    });
  }

  async findAll(negocioId: number) {
    return this.prisma.valorHora.findMany({
      where: { negocioId },
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
        rol: true,
      },
    });

    if (!valorHora) {
      throw new NotFoundException('Valor por hora no encontrado');
    }

    return valorHora;
  }


  async findByUsuarioId(usuarioId: number, negocioId: number) {
    return this.prisma.valorHora.findMany({
      where: {
        usuarioId,
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


    const usuariosConValor = new Set(
      valoresHora
        .map(vh => vh.usuarioId)
        .filter(id => id !== null)
    ).size;

    return {
      valorPromedio,
      valorMaximo,
      usuariosConValor: usuariosConValor,
      totalValores: valoresHora.length,
    };
  }
}






