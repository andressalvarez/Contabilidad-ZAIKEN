import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateValorHoraDto, UpdateValorHoraDto } from './dto';

@Injectable()
export class ValorHoraService {
  constructor(private prisma: PrismaService) {}

  async create(negocioId: number, createValorHoraDto: CreateValorHoraDto) {
    // ✅ Priorizar usuarioId, fallback a personaId
    let usuarioId = createValorHoraDto.usuarioId;
    let personaId = createValorHoraDto.personaId;
    let rolId: number;

    if (usuarioId) {
      // Obtener el rol del usuario
      const usuario = await this.prisma.usuario.findFirst({
        where: { id: usuarioId, negocioId },
        include: { personas: { take: 1 } }
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      rolId = usuario.rolId;
      personaId = usuario.personas?.[0]?.id; // Para compatibilidad
    } else if (personaId) {
      // Backward compatibility: obtener usuario desde persona
      const persona = await this.prisma.persona.findUnique({
        where: { id: personaId },
        include: { rol: true }
      });

      if (!persona) {
        throw new NotFoundException('Persona no encontrada');
      }

      usuarioId = persona.usuarioId;
      rolId = persona.rolId;
    } else {
      throw new NotFoundException('Debe proporcionar usuarioId o personaId');
    }

    return this.prisma.valorHora.create({
      data: {
        negocioId,
        usuarioId,
        personaId, // Mantener para compatibilidad
        rolId,
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
        persona: true, // Mantener para compatibilidad
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
        persona: true, // Mantener para compatibilidad
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
        persona: true, // Mantener para compatibilidad
        rol: true,
      },
    });

    if (!valorHora) {
      throw new NotFoundException('Valor por hora no encontrado');
    }

    return valorHora;
  }

  // ⚠️ Deprecado - usar findByUsuarioId
  async findByPersonaId(personaId: number, negocioId: number) {
    return this.prisma.valorHora.findMany({
      where: {
        personaId,
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
        rol: true,
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });
  }

  // ✅ Nuevo método para buscar por usuarioId
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
        persona: true, // Mantener para compatibilidad
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
        persona: true, // Mantener para compatibilidad
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

    // ✅ Contar usuarios únicos (priorizar usuarioId)
    const usuariosConValor = new Set(
      valoresHora
        .map(vh => vh.usuarioId || vh.personaId) // Usar usuarioId, fallback a personaId
        .filter(id => id !== null)
    ).size;

    return {
      valorPromedio,
      valorMaximo,
      personasConValor: usuariosConValor, // Mantener nombre del campo para compatibilidad con frontend
      totalValores: valoresHora.length,
    };
  }
}






