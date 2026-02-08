import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  AuditService,
  SecurityEventType,
} from '../security/audit/audit.service';
import { RequestContext } from '../common/utils/request-context.util';

interface CreateUsuarioData {
  email: string;
  nombre: string;
  securityRoleId: number;
  activo?: boolean;
  passwordHash: string;
  negocioId: number;
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
  securityRoleId?: number;
  activo?: boolean;
  passwordHash?: string;
  rolId?: number;
  participacionPorc?: number;
  horasTotales?: number;
  aportesTotales?: number;
  valorHora?: number;
  inversionHoras?: number;
  inversionTotal?: number;
  notas?: string;
}

interface AuditOptions {
  actorUserId?: number;
  actorEmail?: string;
  context?: RequestContext;
}

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private auditService: AuditService,
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
        activo: true,
        createdAt: true,
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
        securityRole: {
          select: {
            id: true,
            name: true,
            color: true,
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
        activo: true,
        createdAt: true,
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
        securityRole: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async create(data: CreateUsuarioData, audit?: AuditOptions) {
    const {
      email,
      nombre,
      securityRoleId,
      activo = true,
      passwordHash,
      negocioId,
      participacionPorc = 0,
      ...rest
    } = data;

    // Validar participaciÃƒÂ³n si se proporciona
    if (participacionPorc > 0) {
      await this.validateParticipacion(negocioId, participacionPorc);
    }

    const created = await this.prisma.usuario.create({
      data: {
        email,
        nombre,
        activo,
        password: passwordHash,
        negocioId,
        securityRoleId,
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
        securityRole: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.USER_CREATE,
      targetType: 'Usuario',
      targetId: created.id,
      description: `Usuario creado: ${created.email}`,
      metadata: {
        module: 'usuarios',
        action: 'create',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        createdUser: {
          email: created.email,
          nombre: created.nombre,
          securityRoleId: created.securityRoleId,
          activo: created.activo,
        },
      },
      ipAddress: audit?.context?.ipAddress,
      userAgent: audit?.context?.userAgent,
    });

    return created;
  }

  async update(
    id: number,
    negocioId: number,
    data: UpdateUsuarioData,
    audit?: AuditOptions,
  ) {
    const previous = await this.findOne(id, negocioId);

    // Validar participaciÃƒÂ³n si se estÃƒ¡ actualizando
    if (data.participacionPorc !== undefined) {
      await this.validateParticipacion(negocioId, data.participacionPorc, id);
    }

    const updated = await this.prisma.usuario.update({
      where: { id },
      data: {
        email: data.email,
        nombre: data.nombre,
        securityRoleId: data.securityRoleId,
        activo: data.activo,
        password: data.passwordHash,
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
        securityRole: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.USER_UPDATE,
      targetType: 'Usuario',
      targetId: id,
      description: `Usuario actualizado: ${updated.email}`,
      metadata: {
        module: 'usuarios',
        action: 'update',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        changedFields: Object.keys(data).filter((k) => k !== 'passwordHash'),
        before: {
          email: previous.email,
          nombre: previous.nombre,
          activo: previous.activo,
          securityRoleId: previous.securityRole?.id,
          rolId: previous.rolNegocio?.id,
          participacionPorc: previous.participacionPorc,
        },
        after: {
          email: updated.email,
          nombre: updated.nombre,
          activo: updated.activo,
          securityRoleId: updated.securityRole?.id,
          rolId: updated.rolNegocio?.id,
          participacionPorc: updated.participacionPorc,
        },
      },
      ipAddress: audit?.context?.ipAddress,
      userAgent: audit?.context?.userAgent,
    });

    return updated;
  }

  async delete(id: number, negocioId: number, audit?: AuditOptions) {
    const previous = await this.findOne(id, negocioId);

    await this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.USER_DEACTIVATE,
      targetType: 'Usuario',
      targetId: id,
      description: `Usuario desactivado: ${previous.email}`,
      metadata: {
        module: 'usuarios',
        action: 'delete',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
      },
      ipAddress: audit?.context?.ipAddress,
      userAgent: audit?.context?.userAgent,
    });

    return { message: 'Usuario eliminado exitosamente' };
  }

  /**
   * Validar que la suma de participaciones no exceda 100%
   */
  private async validateParticipacion(
    negocioId: number,
    nuevaParticipacion: number,
    usuarioIdExcluir?: number,
  ) {
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
        `Total de participaciÃƒÂ³n excederÃƒÂ­a 100% (actual: ${totalActual}%, nueva: ${nuevaParticipacion}%, total: ${totalNuevo}%)`,
      );
    }

    this.logger.log(
      `ValidaciÃƒÂ³n participaciÃƒÂ³n OK: ${totalActual}% + ${nuevaParticipacion}% = ${totalNuevo}%`,
    );
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
   * Solicitar recuperaciÃƒÂ³n de contraseÃƒÂ±a
   */
  async requestPasswordReset(email: string, context?: RequestContext) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      // No revelar si el email existe (seguridad)
      return {
        message:
          'Si el email existe, recibirÃƒ¡s instrucciones de recuperaciÃƒÂ³n',
      };
    }

    // Generar token con expiraciÃƒÂ³n de 1 hora
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
    await this.auditService.logSafe({
      negocioId: usuario.negocioId,
      userId: usuario.id,
      eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
      targetType: 'Usuario',
      targetId: usuario.id,
      description: `Solicitud de recuperacion de contrasena (${usuario.email})`,
      metadata: {
        module: 'auth',
        action: 'requestPasswordReset',
        result: 'SUCCESS',
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

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

    return {
      message:
        'Si el email existe, recibirÃƒ¡s instrucciones de recuperaciÃƒÂ³n',
    };
  }

  /**
   * Restablecer contraseÃƒÂ±a con token
   */
  async resetPassword(
    token: string,
    newPassword: string,
    context?: RequestContext,
  ) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gte: new Date() }, // Token no expirado
      },
    });

    if (!usuario) {
      throw new BadRequestException('Token invÃƒ¡lido o expirado');
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

    this.logger.log(`Contrasena actualizada para usuario ID: ${usuario.id}`);
    await this.auditService.logSafe({
      negocioId: usuario.negocioId,
      userId: usuario.id,
      eventType: SecurityEventType.PASSWORD_CHANGE,
      targetType: 'Usuario',
      targetId: usuario.id,
      description: `Contrasena restablecida (${usuario.email})`,
      metadata: { module: 'auth', action: 'resetPassword', result: 'SUCCESS' },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { message: 'ContraseÃƒÂ±a actualizada exitosamente' };
  }

  /**
   * Admin sends password reset email to a specific user
   */
  async sendPasswordResetToUser(
    userId: number,
    negocioId: number,
    audit?: AuditOptions,
  ) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: userId, negocioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Generate token with 1 hour expiration
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    this.logger.log(`Reset token generated for user: ${usuario.email}`);
    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
      targetType: 'Usuario',
      targetId: usuario.id,
      description: `Admin envio recuperacion de contrasena a ${usuario.email}`,
      metadata: {
        module: 'usuarios',
        action: 'sendPasswordResetToUser',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
      },
      ipAddress: audit?.context?.ipAddress,
      userAgent: audit?.context?.userAgent,
    });

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(
        negocioId,
        usuario.email,
        usuario.nombre,
        resetToken,
      );
      this.logger.log(`Password reset email sent to: ${usuario.email}`);
      return {
        message: `Correo de recuperaciÃƒÂ³n enviado a ${usuario.email}`,
      };
    } catch (error) {
      this.logger.error(`Failed to send password reset email:`, error);
      throw new BadRequestException(
        'Error al enviar el correo. Verifica la configuraciÃƒÂ³n SMTP.',
      );
    }
  }

  /**
   * Activar cuenta con token
   */
  async activateAccount(token: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { activationToken: token },
    });

    if (!usuario) {
      throw new NotFoundException('Token de activaciÃƒÂ³n invÃƒ¡lido');
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
