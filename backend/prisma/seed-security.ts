import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PermissionSpec = {
  subject: string;
  action: string;
  category: string;
  displayOrder: number;
  route?: string;
  dependencies?: string[];
};

const ACTION_VERB: Record<string, string> = {
  read: 'consult',
  create: 'create',
  update: 'update',
  delete: 'delete',
  manage: 'manage',
  approve: 'approve',
  reject: 'reject',
  export: 'export',
};

const SUBJECT_LABEL: Record<string, string> = {
  Usuario: 'users',
  SecurityRole: 'security roles and permissions',
  SecurityAuditLog: 'security audit logs',
  SecuritySettings: 'security settings',
  SecuritySession: 'active sessions',
  Permission: 'permission catalog',
  RegistroHoras: 'time entries',
  HourDebt: 'hour debt',
  Transaccion: 'transactions',
  Categoria: 'categories',
  Campana: 'campaigns',
  DistribucionUtilidades: 'profit distribution',
  Settings: 'general settings',
  Negocio: 'business data',
  Dashboard: 'dashboard',
  Estadisticas: 'statistics',
  ValorHora: 'hour value',
  BusinessRole: 'business roles',
  all: 'all system resources',
};

const SUBJECT_SCOPE: Record<string, string> = {
  Usuario: '/usuarios',
  SecurityRole: '/admin/seguridad/roles',
  SecurityAuditLog: '/admin/seguridad/auditoria',
  SecuritySettings: '/admin/seguridad/configuracion',
  SecuritySession: '/admin/seguridad/sesiones',
  RegistroHoras: '/registro-horas',
  HourDebt: '/deuda-horas',
  Transaccion: '/transacciones',
  Categoria: '/categorias',
  Campana: '/campanas',
  DistribucionUtilidades: '/distribucion-utilidades',
  Settings: '/configuracion',
  Negocio: '/configuracion/negocio',
  Dashboard: '/',
  Estadisticas: '/estadisticas',
  ValorHora: '/valor-hora',
  BusinessRole: '/roles',
  all: 'system',
};

const PERMISSIONS: PermissionSpec[] = [
  { subject: 'Usuario', action: 'read', category: 'users', displayOrder: 10 },
  { subject: 'Usuario', action: 'create', category: 'users', displayOrder: 20 },
  { subject: 'Usuario', action: 'update', category: 'users', displayOrder: 30 },
  { subject: 'Usuario', action: 'delete', category: 'users', displayOrder: 40 },
  { subject: 'Usuario', action: 'manage', category: 'users', displayOrder: 50 },

  { subject: 'SecurityRole', action: 'read', category: 'security', displayOrder: 10 },
  { subject: 'SecurityRole', action: 'create', category: 'security', displayOrder: 20 },
  { subject: 'SecurityRole', action: 'update', category: 'security', displayOrder: 30, dependencies: ['PERMISSION.GLOBAL.READ'] },
  { subject: 'SecurityRole', action: 'delete', category: 'security', displayOrder: 40 },
  { subject: 'SecurityRole', action: 'manage', category: 'security', displayOrder: 50 },
  { subject: 'SecurityAuditLog', action: 'read', category: 'security', displayOrder: 60 },
  { subject: 'SecurityAuditLog', action: 'export', category: 'security', displayOrder: 70 },
  { subject: 'SecuritySettings', action: 'read', category: 'security', displayOrder: 80 },
  { subject: 'SecuritySettings', action: 'update', category: 'security', displayOrder: 90, dependencies: ['SECURITY_ROLE.GLOBAL.READ'] },
  { subject: 'SecuritySession', action: 'read', category: 'security', displayOrder: 100 },
  { subject: 'SecuritySession', action: 'delete', category: 'security', displayOrder: 110 },

  { subject: 'Permission', action: 'read', category: 'security', displayOrder: 120 },
  { subject: 'Permission', action: 'create', category: 'security', displayOrder: 130 },
  { subject: 'Permission', action: 'update', category: 'security', displayOrder: 140 },
  { subject: 'Permission', action: 'delete', category: 'security', displayOrder: 150 },

  { subject: 'BusinessRole', action: 'read', category: 'operations', displayOrder: 10 },
  { subject: 'BusinessRole', action: 'create', category: 'operations', displayOrder: 20, dependencies: ['USUARIO.GLOBAL.READ'] },
  { subject: 'BusinessRole', action: 'update', category: 'operations', displayOrder: 30, dependencies: ['USUARIO.GLOBAL.READ'] },
  { subject: 'BusinessRole', action: 'delete', category: 'operations', displayOrder: 40, dependencies: ['USUARIO.GLOBAL.READ'] },
  { subject: 'BusinessRole', action: 'manage', category: 'operations', displayOrder: 50, dependencies: ['USUARIO.GLOBAL.READ'] },

  { subject: 'RegistroHoras', action: 'read', category: 'hours', displayOrder: 10 },
  { subject: 'RegistroHoras', action: 'create', category: 'hours', displayOrder: 20 },
  { subject: 'RegistroHoras', action: 'update', category: 'hours', displayOrder: 30 },
  { subject: 'RegistroHoras', action: 'delete', category: 'hours', displayOrder: 40 },
  { subject: 'RegistroHoras', action: 'approve', category: 'hours', displayOrder: 50 },
  { subject: 'RegistroHoras', action: 'reject', category: 'hours', displayOrder: 60 },
  { subject: 'RegistroHoras', action: 'manage', category: 'hours', displayOrder: 70 },

  { subject: 'HourDebt', action: 'read', category: 'hours', displayOrder: 80 },
  { subject: 'HourDebt', action: 'create', category: 'hours', displayOrder: 90 },
  { subject: 'HourDebt', action: 'update', category: 'hours', displayOrder: 100 },
  { subject: 'HourDebt', action: 'delete', category: 'hours', displayOrder: 110 },
  { subject: 'HourDebt', action: 'manage', category: 'hours', displayOrder: 120 },

  { subject: 'Transaccion', action: 'read', category: 'finance', displayOrder: 10 },
  { subject: 'Transaccion', action: 'create', category: 'finance', displayOrder: 20 },
  { subject: 'Transaccion', action: 'update', category: 'finance', displayOrder: 30 },
  { subject: 'Transaccion', action: 'delete', category: 'finance', displayOrder: 40 },
  { subject: 'Transaccion', action: 'manage', category: 'finance', displayOrder: 50 },

  { subject: 'Categoria', action: 'read', category: 'finance', displayOrder: 60 },
  { subject: 'Categoria', action: 'create', category: 'finance', displayOrder: 70 },
  { subject: 'Categoria', action: 'update', category: 'finance', displayOrder: 80 },
  { subject: 'Categoria', action: 'delete', category: 'finance', displayOrder: 90 },
  { subject: 'Categoria', action: 'manage', category: 'finance', displayOrder: 100 },

  { subject: 'Campana', action: 'read', category: 'operations', displayOrder: 60 },
  { subject: 'Campana', action: 'create', category: 'operations', displayOrder: 70 },
  { subject: 'Campana', action: 'update', category: 'operations', displayOrder: 80 },
  { subject: 'Campana', action: 'delete', category: 'operations', displayOrder: 90 },
  { subject: 'Campana', action: 'manage', category: 'operations', displayOrder: 100 },

  { subject: 'DistribucionUtilidades', action: 'read', category: 'finance', displayOrder: 110 },
  { subject: 'DistribucionUtilidades', action: 'create', category: 'finance', displayOrder: 120 },
  { subject: 'DistribucionUtilidades', action: 'update', category: 'finance', displayOrder: 130 },
  { subject: 'DistribucionUtilidades', action: 'delete', category: 'finance', displayOrder: 140 },
  { subject: 'DistribucionUtilidades', action: 'manage', category: 'finance', displayOrder: 150 },

  { subject: 'Settings', action: 'read', category: 'settings', displayOrder: 10 },
  { subject: 'Settings', action: 'update', category: 'settings', displayOrder: 20 },
  { subject: 'Settings', action: 'manage', category: 'settings', displayOrder: 30 },

  { subject: 'Negocio', action: 'read', category: 'settings', displayOrder: 40 },
  { subject: 'Negocio', action: 'update', category: 'settings', displayOrder: 50 },
  { subject: 'Negocio', action: 'manage', category: 'settings', displayOrder: 60 },

  { subject: 'Dashboard', action: 'read', category: 'reports', displayOrder: 10 },
  { subject: 'Estadisticas', action: 'read', category: 'reports', displayOrder: 20 },
  { subject: 'Estadisticas', action: 'export', category: 'reports', displayOrder: 30 },

  { subject: 'ValorHora', action: 'read', category: 'settings', displayOrder: 70 },
  { subject: 'ValorHora', action: 'update', category: 'settings', displayOrder: 80 },
  { subject: 'ValorHora', action: 'manage', category: 'settings', displayOrder: 90 },

  { subject: 'all', action: 'manage', category: 'system', displayOrder: 999 },
];

function toResource(subject: string): string {
  return subject
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toUpperCase();
}

function toCode(subject: string, action: string): string {
  return `${toResource(subject)}.GLOBAL.${action.toUpperCase()}`;
}

function buildCoreCapability(spec: PermissionSpec): string {
  const label = SUBJECT_LABEL[spec.subject] ?? spec.subject;

  if (spec.action === 'manage') {
    if (spec.subject === 'RegistroHoras') {
      return `Allows full management of ${label}, including approve and reject.`;
    }
    return `Allows full management of ${label} (create, update, delete).`;
  }

  const verb = ACTION_VERB[spec.action] ?? spec.action;
  return `Allows ${verb} on ${label}.`;
}

function buildDescription(spec: PermissionSpec): string {
  const scope = spec.route ?? SUBJECT_SCOPE[spec.subject] ?? `/${toResource(spec.subject).toLowerCase()}`;
  const deps = spec.dependencies && spec.dependencies.length > 0
    ? `Dependencies: ${spec.dependencies.join(', ')}.`
    : 'Dependencies: none.';

  return `${buildCoreCapability(spec)} Main route: ${scope}. ${deps}`;
}

async function seedPermissions() {
  console.log('[seed-security] seeding permissions...');

  for (const spec of PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        subject_action: {
          subject: spec.subject,
          action: spec.action,
        },
      },
      update: {
        code: toCode(spec.subject, spec.action),
        resource: toResource(spec.subject),
        context: 'GLOBAL',
        description: buildDescription(spec),
        category: spec.category,
        route: spec.route ?? SUBJECT_SCOPE[spec.subject] ?? null,
        dependencies: spec.dependencies ?? [],
        displayOrder: spec.displayOrder,
        isSystem: true,
        active: true,
      },
      create: {
        code: toCode(spec.subject, spec.action),
        resource: toResource(spec.subject),
        context: 'GLOBAL',
        subject: spec.subject,
        action: spec.action,
        description: buildDescription(spec),
        category: spec.category,
        route: spec.route ?? SUBJECT_SCOPE[spec.subject] ?? null,
        dependencies: spec.dependencies ?? [],
        displayOrder: spec.displayOrder,
        isSystem: true,
        active: true,
      },
    });
  }

  console.log(`[seed-security] permissions synced: ${PERMISSIONS.length}`);
}

async function upsertBaseRolesAndPermissions() {
  console.log('[seed-security] seeding base roles and role-permissions...');

  const negocios = await prisma.negocio.findMany({ select: { id: true } });
  const allPermissions = await prisma.permission.findMany();
  const migrateLegacyEmployee =
    (process.env.SEED_SECURITY_MIGRATE_LEGACY_EMPLOYEE || 'true').toLowerCase() === 'true';

  for (const negocio of negocios) {
    const adminRole = await prisma.securityRole.upsert({
      where: { negocioId_name: { negocioId: negocio.id, name: 'Administrador' } },
      update: { isSystem: true, active: true, priority: 100, color: '#6366f1' },
      create: {
        negocioId: negocio.id,
        name: 'Administrador',
        description: 'System administrator role',
        color: '#6366f1',
        isSystem: true,
        priority: 100,
        active: true,
      },
    });

    const collaboratorRole = await prisma.securityRole.upsert({
      where: { negocioId_name: { negocioId: negocio.id, name: 'Colaborador' } },
      update: { isSystem: true, active: true, priority: 50, color: '#10b981' },
      create: {
        negocioId: negocio.id,
        name: 'Colaborador',
        description: 'Collaborator base role',
        color: '#10b981',
        isSystem: true,
        priority: 50,
        active: true,
      },
    });

    if (migrateLegacyEmployee) {
      const legacyEmployeeRoles = await prisma.securityRole.findMany({
        where: {
          negocioId: negocio.id,
          OR: [
            { name: 'Empleado' },
            { name: { startsWith: 'Empleado Legacy' } },
          ],
        },
        select: { id: true, name: true },
      });

      for (const legacyRole of legacyEmployeeRoles) {
        if (legacyRole.id === collaboratorRole.id) continue;

        await prisma.usuario.updateMany({
          where: { negocioId: negocio.id, securityRoleId: legacyRole.id },
          data: { securityRoleId: collaboratorRole.id },
        });

        const legacyRolePermissions = await prisma.rolePermission.findMany({
          where: { roleId: legacyRole.id },
          select: { permissionId: true },
        });

        for (const rp of legacyRolePermissions) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: collaboratorRole.id,
                permissionId: rp.permissionId,
              },
            },
            update: {},
            create: {
              roleId: collaboratorRole.id,
              permissionId: rp.permissionId,
            },
          });
        }

        await prisma.securityRole.delete({
          where: { id: legacyRole.id },
        });

        console.log(
          `[seed-security] migrated legacy role ${legacyRole.name} -> Colaborador in negocio ${negocio.id}`,
        );
      }
    }

    const userRole = await prisma.securityRole.upsert({
      where: { negocioId_name: { negocioId: negocio.id, name: 'Usuario' } },
      update: { isSystem: true, active: true, priority: 10, color: '#3b82f6' },
      create: {
        negocioId: negocio.id,
        name: 'Usuario',
        description: 'Basic user role',
        color: '#3b82f6',
        isSystem: true,
        priority: 10,
        active: true,
      },
    });

    const collaboratorPermissions = allPermissions
      .filter(
        (p) =>
          (p.subject === 'RegistroHoras' && ['read', 'create', 'update'].includes(p.action)) ||
          (p.subject === 'Dashboard' && p.action === 'read') ||
          (p.subject === 'Campana' && p.action === 'read') ||
          (p.subject === 'Transaccion' && p.action === 'read') ||
          (p.subject === 'Categoria' && p.action === 'read') ||
          (p.subject === 'ValorHora' && p.action === 'read'),
      )
      .map((p) => p.id);

    const userPermissions = allPermissions
      .filter(
        (p) =>
          (p.subject === 'RegistroHoras' && ['read', 'create'].includes(p.action)) ||
          (p.subject === 'Dashboard' && p.action === 'read'),
      )
      .map((p) => p.id);

    const roleAssignments: Array<{ roleId: number; permissionIds: number[]; roleName: string }> = [
      { roleId: adminRole.id, permissionIds: allPermissions.map((p) => p.id), roleName: 'Administrador' },
      { roleId: collaboratorRole.id, permissionIds: collaboratorPermissions, roleName: 'Colaborador' },
      { roleId: userRole.id, permissionIds: userPermissions, roleName: 'Usuario' },
    ];

    for (const assignment of roleAssignments) {
      for (const permissionId of assignment.permissionIds) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: assignment.roleId,
              permissionId,
            },
          },
          update: {},
          create: {
            roleId: assignment.roleId,
            permissionId,
          },
        });
      }

      console.log(
        `[seed-security] negocio ${negocio.id} role ${assignment.roleName}: ${assignment.permissionIds.length} permissions ensured`,
      );
    }
  }
}

async function assignUserOneAdminIfEnabled() {
  const shouldAssign = (process.env.SEED_SECURITY_ASSIGN_USER1_ADMIN || 'false').toLowerCase() === 'true';

  if (!shouldAssign) {
    console.log('[seed-security] skip user 1 admin assignment (SEED_SECURITY_ASSIGN_USER1_ADMIN != true)');
    return;
  }

  console.log('[seed-security] enforcing user 1 as admin with full permissions...');

  const user = await prisma.usuario.findUnique({
    where: { id: 1 },
    select: { id: true, negocioId: true, email: true, nombre: true },
  });

  if (!user) {
    console.log('[seed-security] user 1 not found, skipping');
    return;
  }

  const adminRole = await prisma.securityRole.upsert({
    where: {
      negocioId_name: {
        negocioId: user.negocioId,
        name: 'Administrador',
      },
    },
    update: {
      isSystem: true,
      active: true,
      priority: 100,
      color: '#6366f1',
    },
    create: {
      negocioId: user.negocioId,
      name: 'Administrador',
      description: 'System administrator role',
      color: '#6366f1',
      isSystem: true,
      priority: 100,
      active: true,
    },
  });

  const allPermissions = await prisma.permission.findMany({
    where: { active: true },
    select: { id: true },
  });

  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });

  if (allPermissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: allPermissions.map((permission) => ({
        roleId: adminRole.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.usuario.update({
    where: { id: user.id },
    data: { securityRoleId: adminRole.id },
  });

  console.log(
    `[seed-security] user 1 (${user.email}) assigned to Administrador with ${allPermissions.length} permissions`,
  );
}

async function main() {
  console.log('[seed-security] start');
  await seedPermissions();
  await upsertBaseRolesAndPermissions();
  await assignUserOneAdminIfEnabled();
  console.log('[seed-security] done');
}

main()
  .catch((error) => {
    console.error('[seed-security] failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
