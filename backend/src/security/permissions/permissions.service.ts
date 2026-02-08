import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AuditService, SecurityEventType } from '../audit/audit.service';
import { RequestContext } from '../../common/utils/request-context.util';

// Permission category metadata for UI display
export const PERMISSION_CATEGORIES = {
  users: { name: 'Usuarios', icon: 'Users', order: 1 },
  security: { name: 'Seguridad', icon: 'Shield', order: 2 },
  hours: { name: 'Gestión de Horas', icon: 'Clock', order: 3 },
  finance: { name: 'Finanzas', icon: 'DollarSign', order: 4 },
  operations: { name: 'Operaciones', icon: 'Briefcase', order: 5 },
  reports: { name: 'Reportes', icon: 'BarChart3', order: 6 },
  settings: { name: 'Configuración', icon: 'Settings', order: 7 },
  system: { name: 'Sistema', icon: 'Cog', order: 8 },
};

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async auditAllTenants(dto: {
    actorUserId?: number;
    actorEmail?: string;
    context?: RequestContext;
    eventType: SecurityEventType | string;
    description: string;
    targetId?: number;
    metadata?: object;
  }) {
    const negocios = await this.prisma.negocio.findMany({
      where: { activo: true },
      select: { id: true },
    });

    await Promise.all(
      negocios.map((negocio) =>
        this.auditService.logSafe({
          negocioId: negocio.id,
          userId: dto.actorUserId,
          eventType: dto.eventType,
          targetType: 'Permission',
          targetId: dto.targetId,
          description: dto.description,
          metadata: dto.metadata,
          ipAddress: dto.context?.ipAddress,
          userAgent: dto.context?.userAgent,
        }),
      ),
    );
  }

  private readonly codeRegex =
    /^[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*$/;

  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
    });

    // Group by category
    const grouped = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          const categoryMeta = PERMISSION_CATEGORIES[permission.category] ?? {
            name: permission.category,
            icon: 'Key',
            order: 999,
          };
          acc[permission.category] = {
            ...categoryMeta,
            category: permission.category,
            permissions: [],
          };
        }
        acc[permission.category].permissions.push(permission);
        return acc;
      },
      {} as Record<string, any>,
    );

    // Sort by category order and return as array
    return Object.values(grouped).sort((a: any, b: any) => a.order - b.order);
  }

  async findByCategory(category: string) {
    return this.prisma.permission.findMany({
      where: { category },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findByCategoryGrouped() {
    const permissions = await this.prisma.permission.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
    });

    return permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    );
  }

  async findBySubject(subject: string) {
    return this.prisma.permission.findMany({
      where: { subject },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getCategories() {
    return Object.entries(PERMISSION_CATEGORIES).map(([key, value]) => ({
      key,
      ...value,
    }));
  }

  // Get permissions for a specific role
  async getPermissionsForRole(roleId: number) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => ({
      ...rp.permission,
      conditions: rp.conditions,
    }));
  }

  // Get permissions for a user (via their security role)
  async getPermissionsForUser(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        securityRole: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user?.securityRole) {
      return [];
    }

    return user.securityRole.permissions.map((rp) => ({
      ...rp.permission,
      conditions: rp.conditions,
    }));
  }

  async create(
    dto: CreatePermissionDto,
    audit?: {
      actorUserId?: number;
      actorEmail?: string;
      context?: RequestContext;
    },
  ) {
    if (!this.codeRegex.test(dto.code)) {
      throw new BadRequestException(
        'Permission code must match RESOURCE.CONTEXT.ACTION (uppercase snake case)',
      );
    }

    const existing = await this.prisma.permission.findFirst({
      where: {
        OR: [{ code: dto.code }, { subject: dto.subject, action: dto.action }],
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Permission code or subject/action already exists',
      );
    }

    const permission = await this.prisma.permission.create({
      data: {
        code: dto.code,
        resource: dto.resource,
        context: dto.context,
        subject: dto.subject,
        action: dto.action,
        description: dto.description,
        category: dto.category,
        route: dto.route?.trim() || null,
        dependencies: dto.dependencies ?? [],
        displayOrder: dto.displayOrder ?? 0,
        isSystem: dto.isSystem ?? false,
        active: dto.active ?? true,
      },
    });

    await this.auditAllTenants({
      actorUserId: audit?.actorUserId,
      actorEmail: audit?.actorEmail,
      context: audit?.context,
      eventType: SecurityEventType.PERMISSION_CHANGE,
      description: `Permiso creado: ${permission.code}`,
      targetId: permission.id,
      metadata: {
        module: 'security.permissions',
        action: 'create',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        permission: {
          code: permission.code,
          subject: permission.subject,
          action: permission.action,
        },
      },
    });

    return permission;
  }

  async update(
    id: number,
    dto: UpdatePermissionDto,
    audit?: {
      actorUserId?: number;
      actorEmail?: string;
      context?: RequestContext;
    },
  ) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    if (dto.code && !this.codeRegex.test(dto.code)) {
      throw new BadRequestException(
        'Permission code must match RESOURCE.CONTEXT.ACTION (uppercase snake case)',
      );
    }

    if (dto.code && dto.code !== permission.code) {
      const existing = await this.prisma.permission.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BadRequestException('Permission code already exists');
      }
    }

    const updated = await this.prisma.permission.update({
      where: { id },
      data: {
        code: dto.code,
        resource: dto.resource,
        context: dto.context,
        subject: dto.subject,
        action: dto.action,
        description: dto.description,
        category: dto.category,
        route: dto.route?.trim() || null,
        dependencies: dto.dependencies ?? [],
        displayOrder: dto.displayOrder,
        isSystem: dto.isSystem,
        active: dto.active,
      },
    });

    await this.auditAllTenants({
      actorUserId: audit?.actorUserId,
      actorEmail: audit?.actorEmail,
      context: audit?.context,
      eventType: SecurityEventType.PERMISSION_CHANGE,
      description: `Permiso actualizado: ${updated.code}`,
      targetId: id,
      metadata: {
        module: 'security.permissions',
        action: 'update',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        before: {
          code: permission.code,
          subject: permission.subject,
          action: permission.action,
          active: permission.active,
        },
        after: {
          code: updated.code,
          subject: updated.subject,
          action: updated.action,
          active: updated.active,
        },
      },
    });

    return updated;
  }

  async remove(
    id: number,
    audit?: {
      actorUserId?: number;
      actorEmail?: string;
      context?: RequestContext;
    },
  ) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    if (permission.isSystem) {
      // For system permissions, soft-disable only.
      const disabled = await this.prisma.permission.update({
        where: { id },
        data: { active: false },
      });
      await this.auditAllTenants({
        actorUserId: audit?.actorUserId,
        actorEmail: audit?.actorEmail,
        context: audit?.context,
        eventType: SecurityEventType.PERMISSION_CHANGE,
        description: `Permiso desactivado: ${permission.code}`,
        targetId: id,
        metadata: {
          module: 'security.permissions',
          action: 'soft-delete',
          result: 'SUCCESS',
          actorEmail: audit?.actorEmail,
          code: permission.code,
        },
      });
      return disabled;
    }

    await this.prisma.rolePermission.deleteMany({
      where: { permissionId: id },
    });
    const deleted = await this.prisma.permission.delete({ where: { id } });
    await this.auditAllTenants({
      actorUserId: audit?.actorUserId,
      actorEmail: audit?.actorEmail,
      context: audit?.context,
      eventType: SecurityEventType.PERMISSION_CHANGE,
      description: `Permiso eliminado: ${permission.code}`,
      targetId: id,
      metadata: {
        module: 'security.permissions',
        action: 'delete',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        code: permission.code,
      },
    });
    return deleted;
  }
}
