import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSecurityRoleDto, UpdateSecurityRoleDto, AssignPermissionsDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(negocioId: number) {
    return this.prisma.securityRole.findMany({
      where: { negocioId },
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

  async create(negocioId: number, dto: CreateSecurityRoleDto) {
    // Check if name already exists for this business
    const existing = await this.prisma.securityRole.findFirst({
      where: { negocioId, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`A role with name "${dto.name}" already exists`);
    }

    return this.prisma.securityRole.create({
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
  }

  async update(id: number, negocioId: number, dto: UpdateSecurityRoleDto) {
    const role = await this.findOne(id, negocioId);

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
        throw new BadRequestException(`A role with name "${dto.name}" already exists`);
      }
    }

    return this.prisma.securityRole.update({
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
  }

  async delete(id: number, negocioId: number) {
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

    return this.prisma.securityRole.delete({
      where: { id },
    });
  }

  async assignPermissions(id: number, negocioId: number, dto: AssignPermissionsDto) {
    const role = await this.findOne(id, negocioId);

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

    return this.findOne(id, negocioId);
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
        rol: true,
        createdAt: true,
      },
    });
  }

  async assignRoleToUser(userId: number, roleId: number, negocioId: number) {
    // Verify role exists and belongs to this business
    await this.findOne(roleId, negocioId);

    // Verify user exists and belongs to this business
    const user = await this.prisma.usuario.findFirst({
      where: { id: userId, negocioId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.usuario.update({
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
  }
}
