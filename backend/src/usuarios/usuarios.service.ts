import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findAll(negocioId: number) {
    return this.prisma.usuario.findMany({
      where: {
        negocioId,
        activo: true,
      },
      select: { id: true, email: true, nombre: true, rol: true, activo: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number, negocioId: number) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        id,
        negocioId,
        activo: true,
      },
      select: { id: true, email: true, nombre: true, rol: true, activo: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  create(data: { email: string; nombre: string; rol: string; activo?: boolean; passwordHash: string; negocioId: number }) {
    const { email, nombre, rol, activo = true, passwordHash, negocioId } = data;
    return this.prisma.usuario.create({ data: { email, nombre, rol, activo, password: passwordHash, negocioId } });
  }

  async update(id: number, negocioId: number, data: Partial<{ email: string; nombre: string; rol: string; activo: boolean; passwordHash: string }>) {
    await this.findOne(id, negocioId);

    return this.prisma.usuario.update({
      where: { id },
      data: {
        email: data.email,
        nombre: data.nombre,
        rol: data.rol,
        activo: data.activo,
        password: data.passwordHash,
      },
      select: { id: true, email: true, nombre: true, rol: true, activo: true, createdAt: true },
    });
  }

  async delete(id: number, negocioId: number) {
    await this.findOne(id, negocioId);

    await this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Usuario eliminado exitosamente' };
  }
}


