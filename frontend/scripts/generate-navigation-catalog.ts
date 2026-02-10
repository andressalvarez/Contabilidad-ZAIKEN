import fs from 'node:fs';
import path from 'node:path';

type Permission = {
  action:
    | 'manage'
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'approve'
    | 'reject';
  subject: string;
};

type KnownItem = {
  itemKey: string;
  title: string;
  icon?: string;
  iconType?: 'bootstrap' | 'lucide';
  activeMatchers?: string[];
  defaultPermission?: Permission;
  isKnownCoreItem: boolean;
};

const FRONTEND_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(FRONTEND_ROOT, 'src', 'app');
const OUTPUT_DIR = path.join(FRONTEND_ROOT, 'src', 'generated');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'navigation-catalog.ts');

const EXCLUDED_PATHS = new Set([
  '/login',
  '/register',
  '/reset-password',
  '/test',
  '/test-api',
  '/test-campanas',
  '/test-modal',
  '/simple',
  '/gastos',
  '/dashboard',
  '/admin/seguridad/configuracion',
]);

const EXCLUDED_PREFIXES = ['/test/', '/simple/'];

const KNOWN_ITEMS_BY_PATH: Record<string, KnownItem> = {
  '/': {
    itemKey: 'dashboard',
    title: 'Dashboard',
    icon: 'bi-grid-1x2-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'Dashboard' },
    isKnownCoreItem: true,
  },
  '/estadisticas': {
    itemKey: 'estadisticas',
    title: 'Estadisticas',
    icon: 'bi-bar-chart-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'Estadisticas' },
    isKnownCoreItem: true,
  },
  '/roles': {
    itemKey: 'roles_negocio',
    title: 'Roles',
    icon: 'bi-person-badge-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'BusinessRole' },
    isKnownCoreItem: true,
  },
  '/valor-hora': {
    itemKey: 'valor_hora',
    title: 'Valor Hora',
    icon: 'bi-clock-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'ValorHora' },
    isKnownCoreItem: true,
  },
  '/registro-horas': {
    itemKey: 'registro_horas',
    title: 'Registro Horas',
    icon: 'bi-calendar2-check-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'RegistroHoras' },
    isKnownCoreItem: true,
  },
  '/horas-pendientes': {
    itemKey: 'aprobar_horas',
    title: 'Aprobar Horas',
    icon: 'bi-clock-history',
    iconType: 'bootstrap',
    defaultPermission: { action: 'approve', subject: 'RegistroHoras' },
    isKnownCoreItem: true,
  },
  '/deuda-horas': {
    itemKey: 'deuda_horas',
    title: 'Deuda de Horas',
    icon: 'bi-hourglass-split',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'HourDebt' },
    isKnownCoreItem: true,
  },
  '/campanas': {
    itemKey: 'campanas',
    title: 'Campanas',
    icon: 'bi-receipt',
    iconType: 'bootstrap',
    activeMatchers: ['/campanas', '/gastos'],
    defaultPermission: { action: 'read', subject: 'Campana' },
    isKnownCoreItem: true,
  },
  '/transacciones': {
    itemKey: 'transacciones',
    title: 'Transacciones',
    icon: 'bi-wallet2',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'Transaccion' },
    isKnownCoreItem: true,
  },
  '/tipos-transaccion': {
    itemKey: 'tipos_transaccion',
    title: 'Tipos de Transaccion',
    icon: 'bi-credit-card-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'Transaccion' },
    isKnownCoreItem: true,
  },
  '/categorias': {
    itemKey: 'categorias',
    title: 'Categorias',
    icon: 'bi-tags-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'Categoria' },
    isKnownCoreItem: true,
  },
  '/distribucion-utilidades': {
    itemKey: 'distribucion_utilidades',
    title: 'Distribucion Utilidades',
    icon: 'bi-pie-chart-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'DistribucionUtilidades' },
    isKnownCoreItem: true,
  },
  '/distribucion-detalle': {
    itemKey: 'distribucion_detalle',
    title: 'Distribucion Detalle',
    icon: 'bi-list-check',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'DistribucionDetalle' },
    isKnownCoreItem: true,
  },
  '/usuarios': {
    itemKey: 'usuarios',
    title: 'Usuarios',
    icon: 'bi-person-gear',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'Usuario' },
    isKnownCoreItem: true,
  },
  '/admin/seguridad/roles': {
    itemKey: 'roles_permisos',
    title: 'Roles y Permisos',
    icon: 'bi-shield-lock-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'SecurityRole' },
    isKnownCoreItem: true,
  },
  '/admin/seguridad/auditoria': {
    itemKey: 'auditoria',
    title: 'Auditoria',
    icon: 'bi-file-earmark-text-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'SecurityAuditLog' },
    isKnownCoreItem: true,
  },
  '/admin/seguridad/feedback': {
    itemKey: 'feedback_bugs',
    title: 'Feedback Bugs',
    icon: 'bi-bug-fill',
    iconType: 'bootstrap',
    defaultPermission: { action: 'read', subject: 'SecurityRole' },
    isKnownCoreItem: true,
  },
  '/configuracion': {
    itemKey: 'configuracion',
    title: 'Configuracion',
    icon: 'bi-gear-fill',
    iconType: 'bootstrap',
    activeMatchers: ['/configuracion', '/admin/seguridad/configuracion'],
    defaultPermission: { action: 'read', subject: 'Settings' },
    isKnownCoreItem: true,
  },
};

const KNOWN_ITEM_ORDER = Object.keys(KNOWN_ITEMS_BY_PATH);

function main() {
  const pageFiles = collectPageFiles(APP_DIR);
  const discoveredRoutes = pageFiles
    .map((filePath) => routeFromFile(filePath))
    .filter((route): route is string => !!route)
    .filter((route) => !isExcludedRoute(route));

  const uniqueRoutes = Array.from(new Set(discoveredRoutes));
  const catalog = buildCatalog(uniqueRoutes);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, renderCatalogFile(catalog));
  console.log(`Navigation catalog generated with ${catalog.length} items at ${OUTPUT_FILE}`);
}

function collectPageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectPageFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name === 'page.tsx') {
      files.push(fullPath);
    }
  }

  return files;
}

function routeFromFile(filePath: string): string | null {
  const relative = path.relative(APP_DIR, filePath);
  const withoutPage = relative.replace(/\\?page\.tsx$/, '').replace(/\/?page\.tsx$/, '');
  const segments = withoutPage
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !segment.startsWith('(') && !segment.endsWith(')'));

  if (segments.some((segment) => segment.startsWith('[') && segment.endsWith(']'))) {
    return null;
  }

  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}

function isExcludedRoute(route: string): boolean {
  if (EXCLUDED_PATHS.has(route)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => route.startsWith(prefix));
}

function buildCatalog(routes: string[]) {
  const knownRoutes = routes.filter((route) => !!KNOWN_ITEMS_BY_PATH[route]);
  const dynamicRoutes = routes.filter((route) => !KNOWN_ITEMS_BY_PATH[route]);

  const knownItems = KNOWN_ITEM_ORDER.filter((route) => knownRoutes.includes(route)).map((route) => ({
    path: route,
    ...KNOWN_ITEMS_BY_PATH[route],
  }));

  const dynamicItems = dynamicRoutes
    .sort((a, b) => a.localeCompare(b))
    .map((route) => ({
      itemKey: buildItemKey(route),
      path: route,
      title: buildTitle(route),
      icon: 'bi-circle-fill',
      iconType: 'bootstrap' as const,
      activeMatchers: [route],
      isKnownCoreItem: false,
    }));

  return [...knownItems, ...dynamicItems];
}

function buildItemKey(route: string): string {
  if (route === '/') return 'home';

  return route
    .replace(/^\//, '')
    .replace(/[^\w/-]/g, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase();
}

function buildTitle(route: string): string {
  if (route === '/') return 'Home';
  const segment = route.split('/').filter(Boolean).slice(-1)[0] || route.replace('/', '');
  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderCatalogFile(catalog: Array<Record<string, unknown>>): string {
  return `/* AUTO-GENERATED FILE. DO NOT EDIT MANUALLY. */

import type { NavigationCatalogItem } from '@/types/navigation';

export const NAVIGATION_CATALOG: NavigationCatalogItem[] = ${JSON.stringify(catalog, null, 2)} as NavigationCatalogItem[];

export const NAVIGATION_CATALOG_BY_KEY: Record<string, NavigationCatalogItem> = Object.fromEntries(
  NAVIGATION_CATALOG.map((item) => [item.itemKey, item]),
);
`;
}

main();
