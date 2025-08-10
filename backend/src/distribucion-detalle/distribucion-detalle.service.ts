import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistribucionDetalleDto } from './dto/create-distribucion-detalle.dto';
import { UpdateDistribucionDetalleDto } from './dto/update-distribucion-detalle.dto';

@Injectable()
export class DistribucionDetalleService {
  constructor(private prisma: PrismaService) {}

  async create(createDistribucionDetalleDto: CreateDistribucionDetalleDto) {
    const detalle = await this.prisma.distribucionDetalle.create({
      data: createDistribucionDetalleDto,
      include: { persona: true, distribucion: true },
    });
    return { data: detalle };
  }

  async findAll(distribucionId?: number) {
    const where = distribucionId ? { distribucionId } : {};
    const detalles = await this.prisma.distribucionDetalle.findMany({
      where,
      include: { persona: true, distribucion: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: detalles };
  }

  async findOne(id: number) {
    const detalle = await this.prisma.distribucionDetalle.findUnique({
      where: { id },
      include: { persona: true, distribucion: true },
    });
    if (!detalle) throw new NotFoundException(`Detalle con ID ${id} no encontrado`);
    return { data: detalle };
  }

  async update(id: number, updateDistribucionDetalleDto: UpdateDistribucionDetalleDto) {
    const detalle = await this.prisma.distribucionDetalle.update({
      where: { id },
      data: updateDistribucionDetalleDto,
      include: { persona: true, distribucion: true },
    });
    return { data: detalle };
  }

  async remove(id: number) {
    await this.prisma.distribucionDetalle.delete({ where: { id } });
    return { message: 'Detalle eliminado exitosamente' };
  }
}
