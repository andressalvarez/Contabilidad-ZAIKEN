import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  AuditService,
  SecurityEventType,
} from '../security/audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private auditService: AuditService,
  ) {}

  async register(params: {
    email: string;
    password: string;
    nombre: string;
    securityRoleId?: number;
    negocioId?: number; // Opcional: para agregar usuarios a un negocio existente
    nombreNegocio?: string; // Opcional: para crear un nuevo negocio
  }) {
    const {
      email,
      password,
      nombre,
      negocioId,
      nombreNegocio,
      securityRoleId,
    } = params;

    const existing = await this.prisma.usuario.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(password, 10);

    // Determinar negocioId y rol de seguridad
    let finalNegocioId = negocioId;
    let finalSecurityRoleId = securityRoleId;

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

      // El que crea el negocio queda con rol Administrador del sistema
      const adminRole = await this.prisma.securityRole.upsert({
        where: {
          negocioId_name: { negocioId: finalNegocioId, name: 'Administrador' },
        },
        update: {
          isSystem: true,
          active: true,
          priority: 100,
          color: '#6366f1',
        },
        create: {
          negocioId: finalNegocioId,
          name: 'Administrador',
          description: 'Rol administrador del sistema',
          color: '#6366f1',
          isSystem: true,
          priority: 100,
          active: true,
        },
      });
      finalSecurityRoleId = adminRole.id;
    } else {
      // Agregar a negocio existente; por defecto usar rol "Usuario"
      if (!finalSecurityRoleId) {
        const userRole = await this.prisma.securityRole.upsert({
          where: {
            negocioId_name: { negocioId: finalNegocioId, name: 'Usuario' },
          },
          update: {
            isSystem: true,
            active: true,
            priority: 10,
            color: '#3b82f6',
          },
          create: {
            negocioId: finalNegocioId,
            name: 'Usuario',
            description: 'Rol base del sistema',
            color: '#3b82f6',
            isSystem: true,
            priority: 10,
            active: true,
          },
        });
        finalSecurityRoleId = userRole.id;
      } else {
        const role = await this.prisma.securityRole.findFirst({
          where: {
            id: finalSecurityRoleId,
            negocioId: finalNegocioId,
            active: true,
          },
        });
        if (!role) {
          throw new BadRequestException(
            'Security role does not belong to the selected business',
          );
        }
      }
    }

    const user = await this.prisma.usuario.create({
      data: {
        email,
        password: passwordHash,
        nombre,
        activo: true,
        negocioId: finalNegocioId,
        securityRoleId: finalSecurityRoleId,
      },
      include: {
        negocio: true,
        securityRole: true,
        rolNegocio: true,
      },
    });

    return this.buildAuthResult(user);
  }

  async login(
    params: { email: string; password: string },
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: params.email },
      include: { negocio: true, securityRole: true, rolNegocio: true },
    });
    if (!user) throw new UnauthorizedException('Credenciales invalidas');
    if (!user.activo) {
      await this.safeAuditLog({
        negocioId: user.negocioId,
        userId: user.id,
        eventType: SecurityEventType.LOGIN_FAILED,
        targetType: 'Usuario',
        targetId: user.id,
        description: `Login fallido: usuario desactivado (${user.email})`,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
      throw new UnauthorizedException('Usuario desactivado');
    }
    if (!user.negocio || !user.negocio.activo) {
      await this.safeAuditLog({
        negocioId: user.negocioId,
        userId: user.id,
        eventType: SecurityEventType.LOGIN_FAILED,
        targetType: 'Negocio',
        targetId: user.negocioId,
        description: `Login fallido: negocio desactivado (${user.email})`,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
      throw new UnauthorizedException('Negocio desactivado');
    }
    const ok = await bcrypt.compare(params.password, user.password);
    if (!ok) {
      await this.safeAuditLog({
        negocioId: user.negocioId,
        userId: user.id,
        eventType: SecurityEventType.LOGIN_FAILED,
        targetType: 'Usuario',
        targetId: user.id,
        description: `Login fallido: credenciales invalidas (${user.email})`,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
      throw new UnauthorizedException('Credenciales invalidas');
    }

    await this.safeAuditLog({
      negocioId: user.negocioId,
      userId: user.id,
      eventType: SecurityEventType.LOGIN,
      targetType: 'Usuario',
      targetId: user.id,
      description: `Inicio de sesion (${user.email})`,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
    return this.buildAuthResult(user);
  }

  private async safeAuditLog(params: {
    negocioId: number;
    userId?: number;
    eventType: SecurityEventType | string;
    targetType?: string;
    targetId?: number;
    description: string;
    metadata?: object;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.auditService.log(params);
    } catch {
      // Avoid blocking auth if audit logging fails
    }
  }
  private buildAuthResult(user: {
    id: number;
    email: string;
    nombre: string;
    negocioId: number;
    securityRoleId: number;
    securityRole?: { id: number; name: string };
    rolNegocio?: { id: number; nombreRol: string } | null;
    negocio?: { id: number; nombre: string; activo: boolean };
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      negocioId: user.negocioId,
      securityRoleId: user.securityRoleId,
      securityRoleName: user.securityRole?.name,
      negocioRoleName: user.rolNegocio?.nombreRol,
    };
    const token = this.jwt.sign(payload);
    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        negocioId: user.negocioId,
        securityRoleId: user.securityRoleId,
        securityRoleName: user.securityRole?.name,
        negocioRoleName: user.rolNegocio?.nombreRol,
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
        securityRole: true,
        rolNegocio: true,
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
