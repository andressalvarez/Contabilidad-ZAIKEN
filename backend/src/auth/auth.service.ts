import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(params: {
    email: string;
    password: string;
    nombre: string;
    rol?: string;
    negocioId?: number; // Opcional: para agregar usuarios a un negocio existente
    nombreNegocio?: string; // Opcional: para crear un nuevo negocio
  }) {
    const { email, password, nombre, negocioId, nombreNegocio } = params;

    const existing = await this.prisma.usuario.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(password, 10);

    // Determinar negocioId y rol
    let finalNegocioId = negocioId;
    let rol = params.rol;

    if (!finalNegocioId) {
      // Crear un nuevo negocio si no existe ninguno, o si el usuario especifica nombreNegocio
      const nombreDelNegocio = nombreNegocio || `Negocio de ${nombre}`;
      const negocio = await this.prisma.negocio.create({
        data: {
          nombre: nombreDelNegocio,
          activo: true,
        },
      });
      finalNegocioId = negocio.id;
      rol = 'ADMIN_NEGOCIO'; // El que crea el negocio es admin
    } else {
      // Agregar a negocio existente
      rol = rol || 'USER'; // Por defecto USER si no se especifica
    }

    const user = await this.prisma.usuario.create({
      data: {
        email,
        password: passwordHash,
        nombre,
        rol,
        activo: true,
        negocioId: finalNegocioId,
      },
      include: {
        negocio: true,
      },
    });

    return this.buildAuthResult(user);
  }

  async login(params: { email: string; password: string }) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: params.email },
      include: { negocio: true },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.activo) throw new UnauthorizedException('Usuario desactivado');
    if (!user.negocio || !user.negocio.activo)
      throw new UnauthorizedException('Negocio desactivado');
    const ok = await bcrypt.compare(params.password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return this.buildAuthResult(user);
  }

  private buildAuthResult(user: {
    id: number;
    email: string;
    nombre: string;
    rol: string;
    negocioId: number;
    negocio?: { id: number; nombre: string; activo: boolean };
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      negocioId: user.negocioId,
    };
    const token = this.jwt.sign(payload);
    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        negocioId: user.negocioId,
        negocio: user.negocio
          ? { id: user.negocio.id, nombre: user.negocio.nombre }
          : undefined,
      },
      token,
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        negocio: true,
        personas: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { password, ...userWithoutPassword } = user;
    return {
      success: true,
      data: userWithoutPassword,
    };
  }
}


