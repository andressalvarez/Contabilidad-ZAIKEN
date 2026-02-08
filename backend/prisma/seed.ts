import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definición de permisos del sistema
const PERMISSIONS = [
  // ===== USUARIOS =====
  { subject: 'Usuario', action: 'read', category: 'users', description: 'Ver usuarios', displayOrder: 10 },
  { subject: 'Usuario', action: 'create', category: 'users', description: 'Crear usuarios', displayOrder: 20 },
  { subject: 'Usuario', action: 'update', category: 'users', description: 'Editar usuarios', displayOrder: 30 },
  { subject: 'Usuario', action: 'delete', category: 'users', description: 'Eliminar usuarios', displayOrder: 40 },
  { subject: 'Usuario', action: 'manage', category: 'users', description: 'Gestión completa de usuarios', displayOrder: 50 },

  // ===== SEGURIDAD =====
  { subject: 'SecurityRole', action: 'read', category: 'security', description: 'Ver roles de seguridad', displayOrder: 10 },
  { subject: 'SecurityRole', action: 'create', category: 'security', description: 'Crear roles de seguridad', displayOrder: 20 },
  { subject: 'SecurityRole', action: 'update', category: 'security', description: 'Editar roles de seguridad', displayOrder: 30 },
  { subject: 'SecurityRole', action: 'delete', category: 'security', description: 'Eliminar roles de seguridad', displayOrder: 40 },
  { subject: 'SecurityRole', action: 'manage', category: 'security', description: 'Gestión completa de roles', displayOrder: 50 },
  { subject: 'SecurityAuditLog', action: 'read', category: 'security', description: 'Ver logs de auditoría', displayOrder: 60 },
  { subject: 'SecurityAuditLog', action: 'export', category: 'security', description: 'Exportar logs de auditoría', displayOrder: 70 },
  { subject: 'SecuritySettings', action: 'read', category: 'security', description: 'Ver configuración de seguridad', displayOrder: 80 },
  { subject: 'SecuritySettings', action: 'update', category: 'security', description: 'Editar configuración de seguridad', displayOrder: 90 },
  { subject: 'SecuritySession', action: 'read', category: 'security', description: 'Ver sesiones activas', displayOrder: 100 },
  { subject: 'SecuritySession', action: 'delete', category: 'security', description: 'Cerrar sesiones', displayOrder: 110 },

  // ===== REGISTRO DE HORAS =====
  { subject: 'RegistroHoras', action: 'read', category: 'hours', description: 'Ver registros de horas', displayOrder: 10 },
  { subject: 'RegistroHoras', action: 'create', category: 'hours', description: 'Crear registros de horas', displayOrder: 20 },
  { subject: 'RegistroHoras', action: 'update', category: 'hours', description: 'Editar registros de horas', displayOrder: 30 },
  { subject: 'RegistroHoras', action: 'delete', category: 'hours', description: 'Eliminar registros de horas', displayOrder: 40 },
  { subject: 'RegistroHoras', action: 'approve', category: 'hours', description: 'Aprobar horas pendientes', displayOrder: 50 },
  { subject: 'RegistroHoras', action: 'reject', category: 'hours', description: 'Rechazar horas pendientes', displayOrder: 60 },
  { subject: 'RegistroHoras', action: 'manage', category: 'hours', description: 'Gestión completa de horas', displayOrder: 70 },

  // ===== DEUDA DE HORAS =====
  { subject: 'HourDebt', action: 'read', category: 'hours', description: 'Ver deudas de horas', displayOrder: 80 },
  { subject: 'HourDebt', action: 'create', category: 'hours', description: 'Crear deudas de horas', displayOrder: 90 },
  { subject: 'HourDebt', action: 'update', category: 'hours', description: 'Editar deudas de horas', displayOrder: 100 },
  { subject: 'HourDebt', action: 'delete', category: 'hours', description: 'Eliminar deudas de horas', displayOrder: 110 },
  { subject: 'HourDebt', action: 'manage', category: 'hours', description: 'Gestión completa de deudas', displayOrder: 120 },

  // ===== TRANSACCIONES =====
  { subject: 'Transaccion', action: 'read', category: 'finance', description: 'Ver transacciones', displayOrder: 10 },
  { subject: 'Transaccion', action: 'create', category: 'finance', description: 'Crear transacciones', displayOrder: 20 },
  { subject: 'Transaccion', action: 'update', category: 'finance', description: 'Editar transacciones', displayOrder: 30 },
  { subject: 'Transaccion', action: 'delete', category: 'finance', description: 'Eliminar transacciones', displayOrder: 40 },
  { subject: 'Transaccion', action: 'manage', category: 'finance', description: 'Gestión completa de transacciones', displayOrder: 50 },

  // ===== CATEGORÍAS =====
  { subject: 'Categoria', action: 'read', category: 'finance', description: 'Ver categorías', displayOrder: 60 },
  { subject: 'Categoria', action: 'create', category: 'finance', description: 'Crear categorías', displayOrder: 70 },
  { subject: 'Categoria', action: 'update', category: 'finance', description: 'Editar categorías', displayOrder: 80 },
  { subject: 'Categoria', action: 'delete', category: 'finance', description: 'Eliminar categorías', displayOrder: 90 },
  { subject: 'Categoria', action: 'manage', category: 'finance', description: 'Gestión completa de categorías', displayOrder: 100 },

  // ===== CAMPAÑAS =====
  { subject: 'Campana', action: 'read', category: 'operations', description: 'Ver campañas', displayOrder: 10 },
  { subject: 'Campana', action: 'create', category: 'operations', description: 'Crear campañas', displayOrder: 20 },
  { subject: 'Campana', action: 'update', category: 'operations', description: 'Editar campañas', displayOrder: 30 },
  { subject: 'Campana', action: 'delete', category: 'operations', description: 'Eliminar campañas', displayOrder: 40 },
  { subject: 'Campana', action: 'manage', category: 'operations', description: 'Gestión completa de campañas', displayOrder: 50 },

  // ===== DISTRIBUCIÓN DE UTILIDADES =====
  { subject: 'DistribucionUtilidades', action: 'read', category: 'finance', description: 'Ver distribuciones de utilidades', displayOrder: 110 },
  { subject: 'DistribucionUtilidades', action: 'create', category: 'finance', description: 'Crear distribuciones de utilidades', displayOrder: 120 },
  { subject: 'DistribucionUtilidades', action: 'update', category: 'finance', description: 'Editar distribuciones de utilidades', displayOrder: 130 },
  { subject: 'DistribucionUtilidades', action: 'delete', category: 'finance', description: 'Eliminar distribuciones de utilidades', displayOrder: 140 },
  { subject: 'DistribucionUtilidades', action: 'manage', category: 'finance', description: 'Gestión completa de distribuciones', displayOrder: 150 },

  // ===== CONFIGURACIÓN =====
  { subject: 'Settings', action: 'read', category: 'settings', description: 'Ver configuración del sistema', displayOrder: 10 },
  { subject: 'Settings', action: 'update', category: 'settings', description: 'Editar configuración del sistema', displayOrder: 20 },
  { subject: 'Settings', action: 'manage', category: 'settings', description: 'Gestión completa de configuración', displayOrder: 30 },

  // ===== NEGOCIO =====
  { subject: 'Negocio', action: 'read', category: 'settings', description: 'Ver información del negocio', displayOrder: 40 },
  { subject: 'Negocio', action: 'update', category: 'settings', description: 'Editar información del negocio', displayOrder: 50 },
  { subject: 'Negocio', action: 'manage', category: 'settings', description: 'Gestión completa del negocio', displayOrder: 60 },

  // ===== ESTADÍSTICAS Y REPORTES =====
  { subject: 'Dashboard', action: 'read', category: 'reports', description: 'Ver dashboard principal', displayOrder: 10 },
  { subject: 'Estadisticas', action: 'read', category: 'reports', description: 'Ver estadísticas', displayOrder: 20 },
  { subject: 'Estadisticas', action: 'export', category: 'reports', description: 'Exportar estadísticas', displayOrder: 30 },

  // ===== VALOR HORA =====
  { subject: 'ValorHora', action: 'read', category: 'settings', description: 'Ver valores de hora', displayOrder: 70 },
  { subject: 'ValorHora', action: 'update', category: 'settings', description: 'Editar valores de hora', displayOrder: 80 },
  { subject: 'ValorHora', action: 'manage', category: 'settings', description: 'Gestión completa de valores hora', displayOrder: 90 },

  // ===== ALL (super permiso) =====
  { subject: 'all', action: 'manage', category: 'system', description: 'Acceso total al sistema (Super Admin)', displayOrder: 999 },
];

// Definición de categorías de permisos
const PERMISSION_CATEGORIES = {
  users: { name: 'Usuarios', icon: 'Users', order: 1 },
  security: { name: 'Seguridad', icon: 'Shield', order: 2 },
  hours: { name: 'Gestión de Horas', icon: 'Clock', order: 3 },
  finance: { name: 'Finanzas', icon: 'DollarSign', order: 4 },
  operations: { name: 'Operaciones', icon: 'Briefcase', order: 5 },
  reports: { name: 'Reportes', icon: 'BarChart3', order: 6 },
  settings: { name: 'Configuración', icon: 'Settings', order: 7 },
  system: { name: 'Sistema', icon: 'Cog', order: 8 },
};

async function seedPermissions() {
  console.log('Seeding permissions...');

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        subject_action: {
          subject: permission.subject,
          action: permission.action,
        },
      },
      update: {
        description: permission.description,
        category: permission.category,
        displayOrder: permission.displayOrder,
      },
      create: {
        subject: permission.subject,
        action: permission.action,
        description: permission.description,
        category: permission.category,
        displayOrder: permission.displayOrder,
      },
    });
  }

  console.log(`✅ ${PERMISSIONS.length} permissions seeded`);
}

async function seedRolePermissions() {
  console.log('Seeding role permissions for existing businesses...');

  // Get all businesses
  const negocios = await prisma.negocio.findMany();

  for (const negocio of negocios) {
    // Get roles for this business
    const roles = await prisma.securityRole.findMany({
      where: { negocioId: negocio.id },
    });

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();
    const permissionMap = new Map(allPermissions.map((p) => [`${p.subject}:${p.action}`, p.id]));

    for (const role of roles) {
      let permissionsToAssign: number[] = [];

      if (role.name === 'Administrador') {
        // Admin gets all permissions
        permissionsToAssign = allPermissions.map((p) => p.id);
      } else if (role.name === 'Manager') {
        // Manager gets most permissions except security management
        const managerPerms = allPermissions.filter(
          (p) =>
            p.category !== 'security' ||
            p.action === 'read' ||
            (p.subject === 'SecurityAuditLog' && p.action === 'read'),
        );
        permissionsToAssign = managerPerms.map((p) => p.id);
      } else if (role.name === 'Empleado') {
        // Employee gets basic permissions
        const employeePerms = allPermissions.filter(
          (p) =>
            (p.category === 'hours' && ['read', 'create', 'update'].includes(p.action)) ||
            (p.subject === 'Dashboard' && p.action === 'read') ||
            (p.subject === 'Campana' && p.action === 'read') ||
            (p.subject === 'Transaccion' && p.action === 'read'),
        );
        permissionsToAssign = employeePerms.map((p) => p.id);
      } else if (role.name === 'Usuario') {
        // Basic user gets minimal permissions
        const userPerms = allPermissions.filter(
          (p) =>
            (p.subject === 'RegistroHoras' && ['read', 'create'].includes(p.action)) ||
            (p.subject === 'Dashboard' && p.action === 'read'),
        );
        permissionsToAssign = userPerms.map((p) => p.id);
      }

      // Assign permissions to role
      for (const permissionId of permissionsToAssign) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId,
          },
        });
      }

      console.log(`  - Role "${role.name}" (negocio ${negocio.id}): ${permissionsToAssign.length} permissions`);
    }
  }

  console.log('✅ Role permissions seeded');
}

async function migrateExistingUsersToSecurityRoles() {
  console.log('Migrating existing users to security roles...');

  const users = await prisma.usuario.findMany({
    where: { securityRoleId: null },
  });

  for (const user of users) {
    // Map legacy rol to security role
    let targetRoleName: string;

    switch (user.rol) {
      case 'ADMIN':
      case 'ADMIN_NEGOCIO':
        targetRoleName = 'Administrador';
        break;
      case 'MANAGER':
        targetRoleName = 'Manager';
        break;
      case 'EMPLEADO':
        targetRoleName = 'Empleado';
        break;
      case 'USER':
      default:
        targetRoleName = 'Usuario';
        break;
    }

    // Find the security role for this business
    const securityRole = await prisma.securityRole.findFirst({
      where: {
        negocioId: user.negocioId,
        name: targetRoleName,
      },
    });

    if (securityRole) {
      await prisma.usuario.update({
        where: { id: user.id },
        data: { securityRoleId: securityRole.id },
      });
      console.log(`  - User "${user.nombre}" (${user.email}): assigned to "${targetRoleName}"`);
    } else {
      console.warn(`  ⚠️ No security role "${targetRoleName}" found for user "${user.email}" in negocio ${user.negocioId}`);
    }
  }

  console.log('✅ User migration completed');
}

async function main() {
  console.log('');
  console.log('=================================================');
  console.log('   SECURITY MANAGEMENT SYSTEM - SEED');
  console.log('=================================================');
  console.log('');

  try {
    // 1. Seed permissions catalog
    await seedPermissions();

    // 2. Assign permissions to existing roles
    await seedRolePermissions();

    // 3. Migrate existing users to security roles
    await migrateExistingUsersToSecurityRoles();

    console.log('');
    console.log('=================================================');
    console.log('   SEED COMPLETED SUCCESSFULLY');
    console.log('=================================================');
    console.log('');
  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
