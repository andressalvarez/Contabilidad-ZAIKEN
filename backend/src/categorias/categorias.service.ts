import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoriaDto: CreateCategoriaDto) {
    return this.prisma.categoria.create({
      data: createCategoriaDto,
    });
  }

  async findAll() {
    return this.prisma.categoria.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id, activo: true },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return categoria;
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto) {
    await this.findOne(id);

    return this.prisma.categoria.update({
      where: { id },
      data: updateCategoriaDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.categoria.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Categoría eliminada exitosamente' };
  }
}
