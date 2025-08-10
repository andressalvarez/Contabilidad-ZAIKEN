import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol, Prisma } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // Crear un nuevo rol
  async create(createRolDto: Prisma.RolCreateInput): Promise<Rol> {
    try {
      return await this.prisma.rol.create({
        data: createRolDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un rol con ese nombre');
      }
      throw error;
    }
  }

  // Obtener todos los roles
  async findAll(): Promise<Rol[]> {
    return this.prisma.rol.findMany({
      orderBy: { importancia: 'desc' },
      include: {
        _count: {
          select: {
            personas: true,
          },
        },
      },
    });
  }

  // Obtener roles activos
  async findActive(): Promise<Rol[]> {
    return this.prisma.rol.findMany({
      where: {
        personas: {
          some: {
            activo: true,
          },
        },
      },
      orderBy: { importancia: 'desc' },
    });
  }

  // Obtener un rol por ID
  async findOne(id: number): Promise<Rol> {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: {
        personas: {
          select: {
            id: true,
            nombre: true,
            activo: true,
          },
        },
        _count: {
          select: {
            personas: true,
            valorHoras: true,
          },
        },
      },
    });

    if (!rol) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return rol;
  }

  // Actualizar un rol
  async update(id: number, updateRolDto: Prisma.RolUpdateInput): Promise<Rol> {
    try {
      const rol = await this.prisma.rol.update({
        where: { id },
        data: updateRolDto,
      });
      return rol;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Rol con ID ${id} no encontrado`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un rol con ese nombre');
      }
      throw error;
    }
  }

  // Eliminar un rol (soft delete si tiene personas asociadas)
  async remove(id: number): Promise<{ message: string }> {
    const rol = await this.findOne(id);

    // Verificar si tiene personas asociadas
    const personasCount = await this.prisma.persona.count({
      where: { rolId: id },
    });

    if (personasCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el rol porque tiene ${personasCount} persona(s) asociada(s)`
      );
    }

    await this.prisma.rol.delete({
      where: { id },
    });

    return { message: `Rol "${rol.nombreRol}" eliminado exitosamente` };
  }

  // Obtener estadísticas del rol
  async getStats(id: number) {
    const rol = await this.findOne(id);

    const stats = await this.prisma.persona.aggregate({
      where: { rolId: id, activo: true },
      _sum: {
        horasTotales: true,
        aportesTotales: true,
        inversionTotal: true,
      },
      _avg: {
        valorHora: true,
        participacionPorc: true,
      },
      _count: true,
    });

    return {
      rol,
      estadisticas: {
        totalPersonas: stats._count,
        horasTotales: stats._sum.horasTotales || 0,
        aportesTotales: stats._sum.aportesTotales || 0,
        inversionTotal: stats._sum.inversionTotal || 0,
        valorHoraPromedio: stats._avg.valorHora || 0,
        participacionPromedio: stats._avg.participacionPorc || 0,
      },
    };
  }
}
