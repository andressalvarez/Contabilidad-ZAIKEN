import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

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
  constructor(private readonly prisma: PrismaService) {}

  private readonly codeRegex = /^[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*$/;

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

  async create(dto: CreatePermissionDto) {
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
      throw new BadRequestException('Permission code or subject/action already exists');
    }

    return this.prisma.permission.create({
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
  }

  async update(id: number, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    if (dto.code && !this.codeRegex.test(dto.code)) {
      throw new BadRequestException(
        'Permission code must match RESOURCE.CONTEXT.ACTION (uppercase snake case)',
      );
    }

    if (dto.code && dto.code !== permission.code) {
      const existing = await this.prisma.permission.findUnique({ where: { code: dto.code } });
      if (existing) {
        throw new BadRequestException('Permission code already exists');
      }
    }

    return this.prisma.permission.update({
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
  }

  async remove(id: number) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    if (permission.isSystem) {
      // For system permissions, soft-disable only.
      return this.prisma.permission.update({
        where: { id },
        data: { active: false },
      });
    }

    await this.prisma.rolePermission.deleteMany({
      where: { permissionId: id },
    });
    return this.prisma.permission.delete({ where: { id } });
  }
}
