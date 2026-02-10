'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronDown, LogOut, X } from 'lucide-react';
import { useRegistroHoras } from '@/hooks/useRegistroHoras';
import { clearAuthToken } from '@/lib/auth';
import { useUser } from '@/hooks/useUser';
import { useSidebar } from '@/contexts/SidebarContext';
import { Action, useAbility } from '@/contexts/AbilityContext';
import { useNavigationLayout } from '@/hooks/useSettings';
import { NAVIGATION_CATALOG_BY_KEY } from '@/generated/navigation-catalog';
import { itemMatchesPath, normalizeNavigationLayout } from '@/lib/navigation';
import type { NavigationCatalogItem } from '@/types/navigation';

type ResolvedItem = {
  itemKey: string;
  order: number;
  shortcut?: boolean;
  catalog: NavigationCatalogItem;
};

type ResolvedSection = {
  id: string;
  title: string;
  order: number;
  items: ResolvedItem[];
};

type ResolvedWorld = {
  id: string;
  name: string;
  order: number;
  enabled?: boolean;
  sections: ResolvedSection[];
};

function readLocalStorageMap(key: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return {};
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalStorageMap(key: string, value: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
}

function getFirstWorldRoute(world: ResolvedWorld): string | null {
  for (const section of world.sections) {
    for (const item of section.items) {
      return item.catalog.path;
    }
  }
  return null;
}

function worldContainsPath(world: ResolvedWorld, pathname: string): boolean {
  return world.sections.some((section) =>
    section.items.some((item) => itemMatchesPath(item.catalog, pathname)),
  );
}

function getItemClasses(itemKey: string, isActive: boolean): string {
  const isAmber = itemKey === 'aprobar_horas' || itemKey === 'deuda_horas';

  if (isAmber) {
    return isActive
      ? 'text-amber-600 bg-amber-50'
      : 'text-gray-700 hover:bg-amber-50';
  }

  return isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50';
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const ability = useAbility();
  const { user } = useUser();
  const { data: registrosHoras = [] } = useRegistroHoras();
  const { data: navigationLayout } = useNavigationLayout();
  const { isOpen, close } = useSidebar();

  const normalizedLayout = useMemo(
    () => normalizeNavigationLayout(navigationLayout || undefined),
    [navigationLayout],
  );

  const storageKey = useMemo(() => {
    if (user) {
      return `zaiken.nav.activeWorld.${user.negocioId}.${user.id}`;
    }
    return 'zaiken.nav.activeWorld.guest';
  }, [user]);

  const lastRouteKey = useMemo(() => {
    if (user) {
      return `zaiken.nav.lastRouteByWorld.${user.negocioId}.${user.id}`;
    }
    return 'zaiken.nav.lastRouteByWorld.guest';
  }, [user]);

  const pendingCount = registrosHoras.filter(
    (record) => !record.aprobado && !record.rechazado && record.estado === 'COMPLETADO',
  ).length;

  const hasAccessToItem = (item: NavigationCatalogItem): boolean => {
    if (!item.defaultPermission) return true;

    const action = item.defaultPermission.action as Action;
    const subject = item.defaultPermission.subject;
    return ability.can(action, subject);
  };

  const resolvedWorlds = useMemo<ResolvedWorld[]>(() => {
    const worlds = [...normalizedLayout.worlds]
      .filter((world) => world.enabled !== false)
      .sort((a, b) => a.order - b.order);

    return worlds.map((world) => {
      const resolvedSections: ResolvedSection[] = [...world.sections]
        .sort((a, b) => a.order - b.order)
        .map((section) => {
          const resolvedItems: ResolvedItem[] = [...section.items]
            .sort((a, b) => a.order - b.order)
            .map((item) => {
              const catalog = NAVIGATION_CATALOG_BY_KEY[item.itemKey];
              if (!catalog || !hasAccessToItem(catalog)) return null;

              const resolvedItem: ResolvedItem = {
                itemKey: item.itemKey,
                order: item.order,
                catalog,
              };

              if (item.shortcut) {
                resolvedItem.shortcut = true;
              }

              return resolvedItem;
            })
            .filter((item): item is ResolvedItem => item !== null);

          return {
            id: section.id,
            title: section.title,
            order: section.order,
            items: resolvedItems,
          };
        })
        .filter((section) => section.items.length > 0);

      return {
        id: world.id,
        name: world.name,
        order: world.order,
        enabled: world.enabled,
        sections: resolvedSections,
      };
    });
  }, [hasAccessToItem, normalizedLayout.worlds]);

  const [activeWorldId, setActiveWorldId] = useState<string>('');
  const [isWorldMenuOpen, setIsWorldMenuOpen] = useState(false);
  const [isManualWorldSelection, setIsManualWorldSelection] = useState(false);

  useEffect(() => {
    if (resolvedWorlds.length === 0) return;

    const validActive = resolvedWorlds.some((world) => world.id === activeWorldId);
    if (validActive) return;

    const savedWorldId =
      typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    const nextWorldId = savedWorldId && resolvedWorlds.some((world) => world.id === savedWorldId)
      ? savedWorldId
      : resolvedWorlds[0].id;

    setActiveWorldId(nextWorldId);
  }, [activeWorldId, resolvedWorlds, storageKey]);

  useEffect(() => {
    if (!activeWorldId || typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, activeWorldId);
  }, [activeWorldId, storageKey]);

  useEffect(() => {
    if (!isWorldMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const clickedInsideWorldMenu = !!target?.closest('[data-world-menu-root="true"]');
      if (!clickedInsideWorldMenu) {
        setIsWorldMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWorldMenuOpen]);

  const matchingWorldIds = useMemo(() => {
    return resolvedWorlds
      .filter((world) => worldContainsPath(world, pathname))
      .map((world) => world.id);
  }, [pathname, resolvedWorlds]);

  useEffect(() => {
    if (isManualWorldSelection) return;
    if (matchingWorldIds.length === 0) return;
    setActiveWorldId((current) => {
      if (current && matchingWorldIds.includes(current)) return current;
      return matchingWorldIds[0];
    });
  }, [isManualWorldSelection, matchingWorldIds]);

  useEffect(() => {
    setIsManualWorldSelection(false);
    setIsWorldMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!pathname || resolvedWorlds.length === 0) return;

    const owner = resolvedWorlds.find((world) => worldContainsPath(world, pathname));
    if (!owner) return;

    const currentMap = readLocalStorageMap(lastRouteKey);
    if (currentMap[owner.id] === pathname) return;

    currentMap[owner.id] = pathname;
    writeLocalStorageMap(lastRouteKey, currentMap);
  }, [lastRouteKey, pathname, resolvedWorlds]);

  const activeWorld =
    resolvedWorlds.find((world) => world.id === activeWorldId) || resolvedWorlds[0] || null;

  const handleWorldChange = (worldId: string) => {
    const world = resolvedWorlds.find((item) => item.id === worldId);
    if (!world) return;

    setIsManualWorldSelection(true);
    setActiveWorldId(worldId);

    const storedRoutes = readLocalStorageMap(lastRouteKey);
    const preferredRoute = storedRoutes[worldId];
    const nextRoute =
      preferredRoute && worldContainsPath(world, preferredRoute)
        ? preferredRoute
        : getFirstWorldRoute(world);

    if (nextRoute && nextRoute !== pathname) {
      router.push(nextRoute);
    }

    setIsWorldMenuOpen(false);
  };

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  const renderItemIcon = (item: NavigationCatalogItem) => {
    const icon = item.icon || 'bi-circle-fill';
    return <i className={`bi ${icon}`}></i>;
  };

  const NavigationContent = () => (
    <>
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Dominios de negocio
        </h3>
        <div className="relative" data-world-menu-root="true">
          <button
            type="button"
            onClick={() => setIsWorldMenuOpen((prev) => !prev)}
            className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            aria-haspopup="menu"
            aria-expanded={isWorldMenuOpen}
            disabled={resolvedWorlds.length === 0}
          >
            <span className="truncate">{activeWorld?.name || 'Seleccionar dominio'}</span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${isWorldMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isWorldMenuOpen && resolvedWorlds.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              <ul className="py-1" role="menu" aria-label="Seleccionar dominio">
                {resolvedWorlds.map((world) => {
                  const isActive = world.id === activeWorld?.id;
                  return (
                    <li key={world.id}>
                      <button
                        type="button"
                        onClick={() => handleWorldChange(world.id)}
                        role="menuitemradio"
                        aria-checked={isActive}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{world.name}</span>
                        {isActive && <Check className="h-4 w-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {!activeWorld && (
        <div className="text-sm text-gray-500 py-6 border border-dashed border-gray-200 rounded-lg text-center">
          No hay dominios configurados
        </div>
      )}

      {activeWorld && activeWorld.sections.length === 0 && (
        <div className="text-sm text-gray-500 py-6 border border-dashed border-gray-200 rounded-lg text-center">
          Este dominio no tiene items visibles
        </div>
      )}

      {activeWorld?.sections.map((section) => (
        <div className="mb-6" key={section.id}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const isActive = itemMatchesPath(item.catalog, pathname);
              const itemClass = getItemClasses(item.itemKey, isActive);
              const isApproveHours = item.itemKey === 'aprobar_horas';

              return (
                <li key={`${section.id}-${item.itemKey}-${item.order}`}>
                  <Link
                    href={item.catalog.path}
                    className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                      isApproveHours ? 'justify-between' : ''
                    } ${itemClass}`}
                  >
                    <div className="flex items-center gap-3">
                      {renderItemIcon(item.catalog)}
                      <span>{item.catalog.title}</span>
                    </div>
                    {isApproveHours && pendingCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-6 pt-6 border-t border-gray-200">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            <p className="text-xs text-gray-500">
              {user.negocioRoleName || user.rolNegocio?.nombreRol || 'Sin rol de negocio'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesion</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:block fixed left-0 top-14 sm:top-16 w-64 h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] bg-white border-r border-gray-200 z-30 overflow-y-auto">
        <nav className="p-4">
          <NavigationContent />
        </nav>
      </aside>

      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 w-72 h-full bg-white border-r border-gray-200 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src="/zaiken.png" alt="Logo" className="h-10 w-10 rounded-full shadow" />
            <h2 className="text-lg font-bold text-gray-900">ZAIKEN</h2>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 h-[calc(100vh-145px)] overflow-y-auto">
          <NavigationContent />
        </nav>
        <div className="border-t border-gray-200 p-3 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </aside>
    </>
  );
}


