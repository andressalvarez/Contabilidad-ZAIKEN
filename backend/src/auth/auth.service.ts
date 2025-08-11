import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(params: { email: string; password: string; nombre: string; rol?: string }) {
    const { email, password, nombre } = params;
    // El primero registrado será ADMIN; los siguientes, USER
    const totalUsuarios = await this.prisma.usuario.count();
    const rol = totalUsuarios === 0 ? 'ADMIN' : 'USER';
    const existing = await this.prisma.usuario.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email ya registrado');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.usuario.create({
      data: { email, password: passwordHash, nombre, rol, activo: true },
    });
    return this.buildAuthResult(user);
  }

  async login(params: { email: string; password: string }) {
    const user = await this.prisma.usuario.findUnique({ where: { email: params.email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(params.password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return this.buildAuthResult(user);
  }

  private buildAuthResult(user: { id: number; email: string; nombre: string; rol: string }) {
    const payload = { sub: user.id, email: user.email, rol: user.rol };
    const token = this.jwt.sign(payload);
    return {
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      token,
    };
  }
}


