import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async create(negocioId: number, createCategoriaDto: CreateCategoriaDto) {
    return this.prisma.categoria.create({
      data: {
        ...createCategoriaDto,
        negocioId,
      },
    });
  }

  async findAll(negocioId: number) {
    return this.prisma.categoria.findMany({
      where: {
        negocioId,
        activo: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number, negocioId: number) {
    const categoria = await this.prisma.categoria.findFirst({
      where: {
        id,
        negocioId,
        activo: true,
      },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return categoria;
  }

  async update(id: number, negocioId: number, updateCategoriaDto: UpdateCategoriaDto) {
    await this.findOne(id, negocioId);

    return this.prisma.categoria.update({
      where: { id },
      data: updateCategoriaDto,
    });
  }

  async remove(id: number, negocioId: number) {
    await this.findOne(id, negocioId);

    await this.prisma.categoria.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Categoría eliminada exitosamente' };
  }
}
