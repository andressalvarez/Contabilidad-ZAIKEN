import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
    });

    // Group by category
    const grouped = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = {
            ...PERMISSION_CATEGORIES[permission.category],
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
}
