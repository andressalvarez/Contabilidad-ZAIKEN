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
  read: 'consultar',
  create: 'crear',
  update: 'actualizar',
  delete: 'eliminar',
  manage: 'gestionar',
  approve: 'aprobar',
  reject: 'rechazar',
  export: 'exportar',
};

const SUBJECT_LABEL: Record<string, string> = {
  Usuario: 'usuarios',
  SecurityRole: 'roles y permisos de seguridad',
  SecurityAuditLog: 'auditoria de seguridad',
  SecuritySettings: 'configuracion de seguridad',
  SecuritySession: 'sesiones activas',
  Permission: 'catalogo de permisos',
  RegistroHoras: 'registros de horas',
  HourDebt: 'deuda de horas',
  Transaccion: 'transacciones',
  Categoria: 'categorias',
  Campana: 'campanas',
  DistribucionUtilidades: 'distribucion de utilidades',
  Settings: 'configuracion general',
  Negocio: 'datos del negocio',
  Dashboard: 'dashboard',
  Estadisticas: 'estadisticas',
  ValorHora: 'valores por hora',
  BusinessRole: 'roles de negocio',
  all: 'todo el sistema',
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
  all: 'sistema completo',
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

function buildAudienceHint(spec: PermissionSpec): string {
  if (spec.subject === 'all') {
    return 'Uso recomendado: solo administradores del sistema.';
  }

  if (spec.subject === 'RegistroHoras' && ['read', 'create', 'update'].includes(spec.action)) {
    return 'Uso recomendado: empleados, colaboradores o administradores.';
  }

  if (spec.subject === 'RegistroHoras' && ['approve', 'reject', 'manage'].includes(spec.action)) {
    return 'Uso recomendado: administradores o lideres autorizados para aprobar horas.';
  }

  if (spec.subject === 'Dashboard' || spec.subject === 'Estadisticas') {
    return 'Uso recomendado: todos los perfiles con acceso operativo.';
  }

  if (spec.subject === 'HourDebt' && spec.action === 'read') {
    return 'Uso recomendado: empleados para consulta y administradores para vista global.';
  }

  if (
    ['SecurityRole', 'SecurityAuditLog', 'SecuritySettings', 'SecuritySession', 'Permission'].includes(spec.subject) ||
    ['manage', 'delete'].includes(spec.action)
  ) {
    return 'Uso recomendado: administradores.';
  }

  if (spec.action === 'manage') {
    return 'Uso recomendado: administradores o coordinadores con responsabilidad de gestion.';
  }

  return 'Uso recomendado: perfiles operativos autorizados.';
}

function buildCoreCapability(spec: PermissionSpec): string {
  const label = SUBJECT_LABEL[spec.subject] ?? spec.subject;

  if (spec.action === 'manage') {
    if (spec.subject === 'RegistroHoras') {
      return `Permite administrar de forma completa ${label}, incluyendo aprobar y rechazar.`;
    }
    return `Permite administrar de forma completa ${label} (crear, editar y eliminar).`;
  }

  const verb = ACTION_VERB[spec.action] ?? spec.action;
  return `Permite ${verb} ${label}.`;
}

function buildDescription(spec: PermissionSpec): string {
  const scope = spec.route ?? SUBJECT_SCOPE[spec.subject] ?? `/${toResource(spec.subject).toLowerCase()}`;
  const deps = spec.dependencies && spec.dependencies.length > 0
    ? `Requiere tambien: ${spec.dependencies.join(', ')}.`
    : 'No requiere permisos adicionales.';

  return `${buildCoreCapability(spec)} Ruta principal: ${scope}. ${buildAudienceHint(spec)} ${deps}`;
}

async function seedPermissions() {
  console.log('Seeding permissions...');

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

  console.log(`Seeded ${PERMISSIONS.length} permissions`);
}

async function seedRolePermissions() {
  console.log('Seeding role permissions for existing businesses...');

  const negocios = await prisma.negocio.findMany();

  for (const negocio of negocios) {
    await prisma.securityRole.upsert({
      where: { negocioId_name: { negocioId: negocio.id, name: 'Administrador' } },
      update: { isSystem: true, active: true, priority: 100, color: '#6366f1' },
      create: {
        negocioId: negocio.id,
        name: 'Administrador',
        description: 'Rol administrador del sistema',
        color: '#6366f1',
        isSystem: true,
        priority: 100,
        active: true,
      },
    });

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

    const collaboratorRole = await prisma.securityRole.upsert({
      where: { negocioId_name: { negocioId: negocio.id, name: 'Colaborador' } },
      update: { isSystem: true, active: true, priority: 50, color: '#10b981' },
      create: {
        negocioId: negocio.id,
        name: 'Colaborador',
        description: 'Rol colaborador del sistema',
        color: '#10b981',
        isSystem: true,
        priority: 50,
        active: true,
      },
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
    }

    await prisma.securityRole.upsert({
      where: { negocioId_name: { negocioId: negocio.id, name: 'Usuario' } },
      update: { isSystem: true, active: true, priority: 10, color: '#3b82f6' },
      create: {
        negocioId: negocio.id,
        name: 'Usuario',
        description: 'Rol base del sistema',
        color: '#3b82f6',
        isSystem: true,
        priority: 10,
        active: true,
      },
    });

    const currentRoles = await prisma.securityRole.findMany({
      where: { negocioId: negocio.id },
    });

    const allPermissions = await prisma.permission.findMany();

    for (const role of currentRoles) {
      let permissionsToAssign: number[] = [];

      if (role.name === 'Administrador') {
        permissionsToAssign = allPermissions.map((p) => p.id);
      } else if (role.name === 'Colaborador') {
        const employeePerms = allPermissions.filter(
          (p) =>
            (p.subject === 'RegistroHoras' && ['read', 'create', 'update'].includes(p.action)) ||
            (p.subject === 'Dashboard' && p.action === 'read') ||
            (p.subject === 'Campana' && p.action === 'read') ||
            (p.subject === 'Transaccion' && p.action === 'read') ||
            (p.subject === 'Categoria' && p.action === 'read') ||
            (p.subject === 'ValorHora' && p.action === 'read'),
        );
        permissionsToAssign = employeePerms.map((p) => p.id);
      } else if (role.name === 'Usuario') {
        const userPerms = allPermissions.filter(
          (p) =>
            (p.subject === 'RegistroHoras' && ['read', 'create'].includes(p.action)) ||
            (p.subject === 'Dashboard' && p.action === 'read'),
        );
        permissionsToAssign = userPerms.map((p) => p.id);
      }

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

  console.log('Role permissions seeded');
}

async function ensureUserOneIsAdmin() {
  console.log('Ensuring user ID 1 has full system permissions...');

  const user = await prisma.usuario.findUnique({
    where: { id: 1 },
    select: { id: true, negocioId: true, email: true, nombre: true },
  });

  if (!user) {
    console.warn('  User ID 1 not found. Skipping admin enforcement.');
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
      description: 'Rol administrador del sistema',
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
    `  - User "${user.nombre}" (${user.email}) => role "Administrador" with ${allPermissions.length} permissions`,
  );
}

async function main() {
  console.log('');
  console.log('=================================================');
  console.log('   SECURITY MANAGEMENT SYSTEM - SEED');
  console.log('=================================================');
  console.log('');

  await seedPermissions();
  await seedRolePermissions();
  await ensureUserOneIsAdmin();

  console.log('');
  console.log('=================================================');
  console.log('   SEED COMPLETED SUCCESSFULLY');
  console.log('=================================================');
  console.log('');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

