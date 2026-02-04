import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistribucionDetalleDto } from './dto/create-distribucion-detalle.dto';
import { UpdateDistribucionDetalleDto } from './dto/update-distribucion-detalle.dto';

@Injectable()
export class DistribucionDetalleService {
  constructor(private prisma: PrismaService) {}

  async create(negocioId: number, createDistribucionDetalleDto: CreateDistribucionDetalleDto) {
    // Validar que la distribucion pertenezca al negocio
    const distribucion = await this.prisma.distribucionUtilidades.findUnique({
      where: { id: createDistribucionDetalleDto.distribucionId },
    });

    if (!distribucion || distribucion.negocioId !== negocioId) {
      throw new ForbiddenException('No tienes permiso para esta distribución');
    }

    return this.prisma.distribucionDetalle.create({
      data: createDistribucionDetalleDto,
      include: { persona: true, distribucion: true },
    });
  }

  async findAll(negocioId: number, distribucionId?: number) {
    const where: any = {
      distribucion: {
        negocioId,
      },
    };

    if (distribucionId) {
      where.distribucionId = distribucionId;
    }

    return this.prisma.distribucionDetalle.findMany({
      where,
      include: { persona: true, distribucion: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, negocioId: number) {
    const detalle = await this.prisma.distribucionDetalle.findFirst({
      where: {
        id,
        distribucion: {
          negocioId,
        },
      },
      include: { persona: true, distribucion: true },
    });

    if (!detalle) {
      throw new NotFoundException(`Detalle con ID ${id} no encontrado`);
    }

    return detalle;
  }

  async update(id: number, negocioId: number, updateDistribucionDetalleDto: UpdateDistribucionDetalleDto) {
    // Validar que el detalle pertenezca al negocio
    await this.findOne(id, negocioId);

    // Si se actualiza la distribucionId, validar que pertenezca al negocio
    if (updateDistribucionDetalleDto.distribucionId) {
      const distribucion = await this.prisma.distribucionUtilidades.findUnique({
        where: { id: updateDistribucionDetalleDto.distribucionId },
      });

      if (!distribucion || distribucion.negocioId !== negocioId) {
        throw new ForbiddenException('No tienes permiso para esta distribución');
      }
    }

    return this.prisma.distribucionDetalle.update({
      where: { id },
      data: updateDistribucionDetalleDto,
      include: { persona: true, distribucion: true },
    });
  }

  async remove(id: number, negocioId: number) {
    await this.findOne(id, negocioId);

    await this.prisma.distribucionDetalle.delete({
      where: { id },
    });

    return { message: 'Detalle eliminado exitosamente' };
  }
}
