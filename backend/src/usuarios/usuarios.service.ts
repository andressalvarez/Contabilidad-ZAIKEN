import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

interface CreateUsuarioData {
  email: string;
  nombre: string;
  rol: string;
  activo?: boolean;
  passwordHash: string;
  negocioId: number;
  // Campos migrados de Persona
  rolId?: number;
  participacionPorc?: number;
  horasTotales?: number;
  aportesTotales?: number;
  valorHora?: number;
  inversionHoras?: number;
  inversionTotal?: number;
  notas?: string;
}

interface UpdateUsuarioData {
  email?: string;
  nombre?: string;
  rol?: string;
  activo?: boolean;
  passwordHash?: string;
  // Campos migrados de Persona
  rolId?: number;
  participacionPorc?: number;
  horasTotales?: number;
  aportesTotales?: number;
  valorHora?: number;
  inversionHoras?: number;
  inversionTotal?: number;
  notas?: string;
}

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll(negocioId: number) {
    return this.prisma.usuario.findMany({
      where: {
        negocioId,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        // Campos migrados de Persona
        rolId: true,
        participacionPorc: true,
        horasTotales: true,
        aportesTotales: true,
        valorHora: true,
        inversionTotal: true,
        notas: true,
        emailVerified: true,
        // Relaciones
        rolNegocio: {
          select: {
            id: true,
            nombreRol: true,
          },
        },
      },
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
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        // Campos migrados de Persona
        rolId: true,
        participacionPorc: true,
        horasTotales: true,
        aportesTotales: true,
        valorHora: true,
        inversionHoras: true,
        inversionTotal: true,
        notas: true,
        emailVerified: true,
        // Relaciones
        rolNegocio: {
          select: {
            id: true,
            nombreRol: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async create(data: CreateUsuarioData) {
    const { email, nombre, rol, activo = true, passwordHash, negocioId, participacionPorc = 0, ...rest } = data;

    // Validar participación si se proporciona
    if (participacionPorc > 0) {
      await this.validateParticipacion(negocioId, participacionPorc);
    }

    return this.prisma.usuario.create({
      data: {
        email,
        nombre,
        rol,
        activo,
        password: passwordHash,
        negocioId,
        participacionPorc,
        horasTotales: rest.horasTotales || 0,
        aportesTotales: rest.aportesTotales || 0,
        valorHora: rest.valorHora || 0,
        inversionHoras: rest.inversionHoras || 0,
        inversionTotal: rest.inversionTotal || 0,
        rolId: rest.rolId,
        notas: rest.notas,
      },
      include: {
        rolNegocio: {
          select: {
            id: true,
            nombreRol: true,
          },
        },
      },
    });
  }

  async update(id: number, negocioId: number, data: UpdateUsuarioData) {
    await this.findOne(id, negocioId);

    // Validar participación si se está actualizando
    if (data.participacionPorc !== undefined) {
      await this.validateParticipacion(negocioId, data.participacionPorc, id);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        email: data.email,
        nombre: data.nombre,
        rol: data.rol,
        activo: data.activo,
        password: data.passwordHash,
        // Campos migrados de Persona
        rolId: data.rolId,
        participacionPorc: data.participacionPorc,
        horasTotales: data.horasTotales,
        aportesTotales: data.aportesTotales,
        valorHora: data.valorHora,
        inversionHoras: data.inversionHoras,
        inversionTotal: data.inversionTotal,
        notas: data.notas,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        participacionPorc: true,
        horasTotales: true,
        inversionTotal: true,
        rolNegocio: {
          select: {
            id: true,
            nombreRol: true,
          },
        },
      },
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

  /**
   * Validar que la suma de participaciones no exceda 100%
   */
  private async validateParticipacion(negocioId: number, nuevaParticipacion: number, usuarioIdExcluir?: number) {
    const agregado = await this.prisma.usuario.aggregate({
      where: {
        negocioId,
        activo: true,
        id: usuarioIdExcluir ? { not: usuarioIdExcluir } : undefined,
      },
      _sum: {
        participacionPorc: true,
      },
    });

    const totalActual = agregado._sum.participacionPorc || 0;
    const totalNuevo = totalActual + nuevaParticipacion;

    if (totalNuevo > 100) {
      throw new BadRequestException(
        `Total de participación excedería 100% (actual: ${totalActual}%, nueva: ${nuevaParticipacion}%, total: ${totalNuevo}%)`,
      );
    }

    this.logger.log(`Validación participación OK: ${totalActual}% + ${nuevaParticipacion}% = ${totalNuevo}%`);
  }

  /**
   * Obtener resumen de usuarios con totales
   */
  async getSummary(negocioId: number) {
    const usuarios = await this.findAll(negocioId);

    const agregado = await this.prisma.usuario.aggregate({
      where: { negocioId, activo: true },
      _sum: {
        participacionPorc: true,
        horasTotales: true,
        inversionTotal: true,
      },
    });

    return {
      usuarios,
      totales: {
        participacionTotal: agregado._sum.participacionPorc || 0,
        horasTotales: agregado._sum.horasTotales || 0,
        inversionTotal: agregado._sum.inversionTotal || 0,
      },
    };
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      // No revelar si el email existe (seguridad)
      return { message: 'Si el email existe, recibirás instrucciones de recuperación' };
    }

    // Generar token con expiración de 1 hora
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    this.logger.log(`Token de reset generado para: ${email}`);

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(
        usuario.negocioId,
        usuario.email,
        usuario.nombre,
        resetToken,
      );
      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email:`, error);
      // Don't fail the request if email fails
    }

    return { message: 'Si el email existe, recibirás instrucciones de recuperación' };
  }

  /**
   * Restablecer contraseña con token
   */
  async resetPassword(token: string, newPassword: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gte: new Date() }, // Token no expirado
      },
    });

    if (!usuario) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    this.logger.log(`Contraseña actualizada para usuario ID: ${usuario.id}`);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Activar cuenta con token
   */
  async activateAccount(token: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { activationToken: token },
    });

    if (!usuario) {
      throw new NotFoundException('Token de activación inválido');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerified: true,
        activationToken: null,
        activo: true,
      },
    });

    this.logger.log(`Cuenta activada para usuario ID: ${usuario.id}`);

    // Send activation email
    try {
      await this.emailService.sendActivationEmail(
        usuario.negocioId,
        usuario.email,
        usuario.nombre,
        token, // Use activation token as reference
      );
      this.logger.log(`Activation email sent to: ${usuario.email}`);
    } catch (error) {
      this.logger.error(`Failed to send activation email:`, error);
    }

    return { message: 'Cuenta activada exitosamente' };
  }
}

