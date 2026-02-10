import type {
  NavigationCatalogItem,
  NavigationLayout,
  NavigationSection,
  NavigationWorld,
} from '@/types/navigation';

export const DEFAULT_NAVIGATION_LAYOUT: NavigationLayout = {
  version: 1,
  worlds: [
    {
      id: 'negocio',
      name: 'Negocio',
      order: 1,
      enabled: true,
      sections: [
        {
          id: 'principal',
          title: 'Principal',
          order: 1,
          items: [
            { itemKey: 'dashboard', order: 1 },
            { itemKey: 'estadisticas', order: 2 },
          ],
        },
        {
          id: 'gestion_personal',
          title: 'Gestion de Personal',
          order: 2,
          items: [
            { itemKey: 'roles_negocio', order: 1 },
            { itemKey: 'valor_hora', order: 2 },
            { itemKey: 'registro_horas', order: 3 },
            { itemKey: 'aprobar_horas', order: 4 },
            { itemKey: 'deuda_horas', order: 5 },
          ],
        },
        {
          id: 'operaciones',
          title: 'Operaciones',
          order: 3,
          items: [
            { itemKey: 'campanas', order: 1 },
            { itemKey: 'transacciones', order: 2 },
            { itemKey: 'tipos_transaccion', order: 3 },
            { itemKey: 'categorias', order: 4 },
          ],
        },
        {
          id: 'distribucion',
          title: 'Distribucion',
          order: 4,
          items: [
            { itemKey: 'distribucion_utilidades', order: 1 },
            { itemKey: 'distribucion_detalle', order: 2 },
          ],
        },
      ],
    },
    {
      id: 'plataforma',
      name: 'Plataforma',
      order: 2,
      enabled: true,
      sections: [
        {
          id: 'administracion',
          title: 'Administracion',
          order: 1,
          items: [
            { itemKey: 'usuarios', order: 1 },
            { itemKey: 'roles_permisos', order: 2 },
            { itemKey: 'auditoria', order: 3 },
            { itemKey: 'feedback_bugs', order: 4 },
            { itemKey: 'configuracion', order: 5 },
          ],
        },
      ],
    },
    {
      id: 'ia',
      name: 'IA',
      order: 3,
      enabled: true,
      sections: [
        {
          id: 'sin_asignar',
          title: 'Sin asignar',
          order: 1,
          items: [],
        },
      ],
    },
  ],
};

export function cloneNavigationLayout(layout: NavigationLayout): NavigationLayout {
  return JSON.parse(JSON.stringify(layout)) as NavigationLayout;
}

export function normalizeNavigationLayout(layout?: NavigationLayout | null): NavigationLayout {
  if (!layout || !Array.isArray(layout.worlds)) {
    return cloneNavigationLayout(DEFAULT_NAVIGATION_LAYOUT);
  }

  const worlds = layout.worlds
    .filter((world): world is NavigationWorld => !!world && typeof world.id === 'string')
    .map((world, worldIndex) => ({
      id: world.id || `world_${worldIndex + 1}`,
      name: world.name || `Dominio ${worldIndex + 1}`,
      order: toOrder(world.order, worldIndex + 1),
      enabled: world.enabled !== false,
      sections: normalizeSections(world.sections),
    }));

  return {
    version: Number.isInteger(layout.version) && layout.version > 0 ? layout.version : 1,
    worlds: worlds.length > 0 ? worlds : cloneNavigationLayout(DEFAULT_NAVIGATION_LAYOUT).worlds,
    updatedAt: layout.updatedAt,
    updatedBy: layout.updatedBy ?? null,
  };
}

function normalizeSections(sections?: NavigationSection[]): NavigationSection[] {
  if (!Array.isArray(sections)) return [];
  return sections
    .filter((section): section is NavigationSection => !!section && typeof section.id === 'string')
    .map((section, sectionIndex) => ({
      id: section.id || `section_${sectionIndex + 1}`,
      title: section.title || `Seccion ${sectionIndex + 1}`,
      order: toOrder(section.order, sectionIndex + 1),
      items: Array.isArray(section.items)
        ? section.items
            .filter((item) => !!item && typeof item.itemKey === 'string')
            .map((item, itemIndex) => ({
              itemKey: item.itemKey,
              order: toOrder(item.order, itemIndex + 1),
              shortcut: item.shortcut === true ? true : undefined,
            }))
        : [],
    }));
}

export function reindexNavigationLayout(layout: NavigationLayout): NavigationLayout {
  const cloned = cloneNavigationLayout(layout);
  cloned.worlds = cloned.worlds
    .sort((a, b) => toOrder(a.order, 0) - toOrder(b.order, 0))
    .map((world, worldIndex) => ({
      ...world,
      order: worldIndex + 1,
      sections: world.sections
        .sort((a, b) => toOrder(a.order, 0) - toOrder(b.order, 0))
        .map((section, sectionIndex) => ({
          ...section,
          order: sectionIndex + 1,
          items: section.items
            .sort((a, b) => toOrder(a.order, 0) - toOrder(b.order, 0))
            .map((item, itemIndex) => ({
              ...item,
              order: itemIndex + 1,
            })),
        })),
    }));

  return cloned;
}

export function getAssignedItemKeys(layout: NavigationLayout): Set<string> {
  const keys = new Set<string>();
  for (const world of layout.worlds) {
    for (const section of world.sections) {
      for (const item of section.items) {
        keys.add(item.itemKey);
      }
    }
  }
  return keys;
}

export function getUnassignedCatalogItems(
  layout: NavigationLayout,
  catalog: NavigationCatalogItem[],
): NavigationCatalogItem[] {
  const assigned = getAssignedItemKeys(layout);
  return catalog.filter((item) => !assigned.has(item.itemKey));
}

export function itemMatchesPath(item: NavigationCatalogItem, pathname: string): boolean {
  if (isPathMatch(item.path, pathname)) return true;
  if (!item.activeMatchers || item.activeMatchers.length === 0) return false;
  return item.activeMatchers.some((matcher) => isPathMatch(matcher, pathname));
}

export function isPathMatch(matcher: string, pathname: string): boolean {
  if (!matcher) return false;

  if (matcher.endsWith('*')) {
    const prefix = matcher.slice(0, -1);
    return pathname.startsWith(prefix);
  }

  if (pathname === matcher) return true;

  if (matcher !== '/' && pathname.startsWith(`${matcher}/`)) {
    return true;
  }

  return false;
}

function toOrder(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  return Math.max(0, fallback);
}
