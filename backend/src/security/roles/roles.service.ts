import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSecurityRoleDto,
  UpdateSecurityRoleDto,
  AssignPermissionsDto,
} from './dto';
import { AuditService, SecurityEventType } from '../audit/audit.service';
import { RequestContext } from '../../common/utils/request-context.util';

interface AuditOptions extends RequestContext {
  actorUserId?: number;
  actorEmail?: string;
}

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private validateRoleName(name?: string) {
    if (!name) return;

    const normalized = name.trim().toLowerCase();
    if (normalized === 'empleado') {
      throw new BadRequestException(
        'El rol "Empleado" esta deprecado. Usa "Colaborador".',
      );
    }
  }

  async findAll(negocioId: number) {
    return this.prisma.securityRole.findMany({
      where: { negocioId, active: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: number, negocioId: number) {
    const role = await this.prisma.securityRole.findFirst({
      where: { id, negocioId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          select: {
            id: true,
            nombre: true,
            email: true,
            activo: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async create(
    negocioId: number,
    dto: CreateSecurityRoleDto,
    audit?: AuditOptions,
  ) {
    this.validateRoleName(dto.name);

    // Check if name already exists for this business
    const existing = await this.prisma.securityRole.findFirst({
      where: { negocioId, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(
        `A role with name "${dto.name}" already exists`,
      );
    }

    const role = await this.prisma.securityRole.create({
      data: {
        negocioId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        priority: dto.priority ?? 0,
        active: dto.active ?? true,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.ROLE_CREATE,
      targetType: 'SecurityRole',
      targetId: role.id,
      description: `Rol creado: ${role.name}`,
      metadata: {
        module: 'security.roles',
        action: 'create',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        role: {
          name: role.name,
          description: role.description,
          priority: role.priority,
          active: role.active,
        },
      },
      ipAddress: audit?.ipAddress,
      userAgent: audit?.userAgent,
    });

    return role;
  }

  async update(
    id: number,
    negocioId: number,
    dto: UpdateSecurityRoleDto,
    audit?: AuditOptions,
  ) {
    const role = await this.findOne(id, negocioId);
    this.validateRoleName(dto.name);

    // System roles cannot have their name changed
    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('System role names cannot be changed');
    }

    // Check if new name conflicts with existing
    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.securityRole.findFirst({
        where: { negocioId, name: dto.name, id: { not: id } },
      });

      if (existing) {
        throw new BadRequestException(
          `A role with name "${dto.name}" already exists`,
        );
      }
    }

    const updated = await this.prisma.securityRole.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        priority: dto.priority,
        active: dto.active,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.ROLE_UPDATE,
      targetType: 'SecurityRole',
      targetId: id,
      description: `Rol actualizado: ${updated.name}`,
      metadata: {
        module: 'security.roles',
        action: 'update',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        before: {
          name: role.name,
          description: role.description,
          color: role.color,
          priority: role.priority,
          active: role.active,
        },
        after: {
          name: updated.name,
          description: updated.description,
          color: updated.color,
          priority: updated.priority,
          active: updated.active,
        },
      },
      ipAddress: audit?.ipAddress,
      userAgent: audit?.userAgent,
    });

    return updated;
  }

  async delete(id: number, negocioId: number, audit?: AuditOptions) {
    const role = await this.findOne(id, negocioId);

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    // Check if role has users assigned
    const usersCount = await this.prisma.usuario.count({
      where: { securityRoleId: id },
    });

    if (usersCount > 0) {
      throw new BadRequestException(
        `Cannot delete role with ${usersCount} user(s) assigned. Reassign users first.`,
      );
    }

    const deleted = await this.prisma.securityRole.delete({
      where: { id },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.ROLE_DELETE,
      targetType: 'SecurityRole',
      targetId: id,
      description: `Rol eliminado: ${deleted.name}`,
      metadata: {
        module: 'security.roles',
        action: 'delete',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        role: {
          name: deleted.name,
          description: deleted.description,
        },
      },
      ipAddress: audit?.ipAddress,
      userAgent: audit?.userAgent,
    });

    return deleted;
  }

  async assignPermissions(
    id: number,
    negocioId: number,
    dto: AssignPermissionsDto,
    audit?: AuditOptions,
  ) {
    const role = await this.findOne(id, negocioId);
    const previous = await this.prisma.rolePermission.findMany({
      where: { roleId: id },
      select: { permissionId: true },
    });

    // Delete existing permissions for this role
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Create new permission assignments
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
          conditions: dto.conditions?.[permissionId] ?? undefined,
        })),
      });
    }

    const result = await this.findOne(id, negocioId);
    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.PERMISSION_CHANGE,
      targetType: 'SecurityRole',
      targetId: id,
      description: `Permisos actualizados para rol: ${role.name}`,
      metadata: {
        module: 'security.roles',
        action: 'assignPermissions',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        previousPermissionIds: previous.map((p) => p.permissionId),
        newPermissionIds: dto.permissionIds || [],
      },
      ipAddress: audit?.ipAddress,
      userAgent: audit?.userAgent,
    });
    return result;
  }

  async getUsersForRole(id: number, negocioId: number) {
    await this.findOne(id, negocioId); // Verify role exists

    return this.prisma.usuario.findMany({
      where: { securityRoleId: id, negocioId },
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        securityRoleId: true,
        createdAt: true,
      },
    });
  }

  async assignRoleToUser(
    userId: number,
    roleId: number,
    negocioId: number,
    audit?: AuditOptions,
  ) {
    // Verify role exists and belongs to this business
    await this.findOne(roleId, negocioId);

    // Verify user exists and belongs to this business
    const user = await this.prisma.usuario.findFirst({
      where: { id: userId, negocioId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id: userId },
      data: { securityRoleId: roleId },
      select: {
        id: true,
        nombre: true,
        email: true,
        securityRoleId: true,
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
      eventType: SecurityEventType.ROLE_ASSIGN,
      targetType: 'Usuario',
      targetId: userId,
      description: `Rol asignado a usuario: ${updatedUser.email} -> ${updatedUser.securityRole?.name}`,
      metadata: {
        module: 'security.roles',
        action: 'assignRoleToUser',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        assignedRoleId: roleId,
      },
      ipAddress: audit?.ipAddress,
      userAgent: audit?.userAgent,
    });

    return updatedUser;
  }
}
