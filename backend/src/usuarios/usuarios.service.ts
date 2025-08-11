import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, email: true, nombre: true, rol: true, activo: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  create(data: { email: string; nombre: string; rol: string; activo?: boolean; passwordHash: string }) {
    const { email, nombre, rol, activo = true, passwordHash } = data;
    return this.prisma.usuario.create({ data: { email, nombre, rol, activo, password: passwordHash } });
  }

  update(id: number, data: Partial<{ email: string; nombre: string; rol: string; activo: boolean; passwordHash: string }>) {
    return this.prisma.usuario.update({
      where: { id },
      data: {
        email: data.email,
        nombre: data.nombre,
        rol: data.rol,
        activo: data.activo,
        password: data.passwordHash,
      },
    });
  }

  delete(id: number) {
    return this.prisma.usuario.delete({ where: { id } });
  }
}


