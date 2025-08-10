import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoTransaccionDto, UpdateTipoTransaccionDto } from './dto';

@Injectable()
export class TiposTransaccionService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los tipos de transacción
  async findAll() {
    const tipos = await this.prisma.tipoTransaccion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });

    return {
      data: tipos,
      success: true,
      message: 'Tipos de transacción obtenidos exitosamente'
    };
  }

  // Obtener un tipo de transacción por ID
  async findOne(id: number) {
    const tipo = await this.prisma.tipoTransaccion.findUnique({
      where: { id }
    });

    if (!tipo) {
      throw new Error('Tipo de transacción no encontrado');
    }

    return {
      data: tipo,
      success: true,
      message: 'Tipo de transacción obtenido exitosamente'
    };
  }

  // Crear un nuevo tipo de transacción
  async create(createTipoTransaccionDto: CreateTipoTransaccionDto) {
    const tipo = await this.prisma.tipoTransaccion.create({
      data: createTipoTransaccionDto
    });

    return {
      data: tipo,
      success: true,
      message: 'Tipo de transacción creado exitosamente'
    };
  }

  // Actualizar un tipo de transacción
  async update(id: number, updateTipoTransaccionDto: UpdateTipoTransaccionDto) {
    const tipo = await this.prisma.tipoTransaccion.update({
      where: { id },
      data: updateTipoTransaccionDto
    });

    return {
      data: tipo,
      success: true,
      message: 'Tipo de transacción actualizado exitosamente'
    };
  }

  // Eliminar un tipo de transacción (soft delete)
  async remove(id: number) {
    await this.prisma.tipoTransaccion.update({
      where: { id },
      data: { activo: false }
    });

    return {
      success: true,
      message: 'Tipo de transacción eliminado exitosamente'
    };
  }
}
