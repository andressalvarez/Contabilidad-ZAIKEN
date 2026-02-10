'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { NAVIGATION_CATALOG, NAVIGATION_CATALOG_BY_KEY } from '@/generated/navigation-catalog';
import {
  cloneNavigationLayout,
  getUnassignedCatalogItems,
  normalizeNavigationLayout,
  reindexNavigationLayout,
} from '@/lib/navigation';
import {
  useNavigationLayout,
  useResetNavigationLayout,
  useUpdateNavigationLayout,
} from '@/hooks/useSettings';
import type {
  NavigationLayout,
  NavigationPlacement,
  NavigationSection,
  NavigationWorld,
} from '@/types/navigation';

function slugify(value: string, fallback: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
  return normalized.length > 0 ? normalized : fallback;
}

function buildUniqueId(
  base: string,
  existingIds: Set<string>,
  fallbackPrefix: string,
): string {
  const root = slugify(base, fallbackPrefix);
  if (!existingIds.has(root)) return root;

  let count = 2;
  while (existingIds.has(`${root}_${count}`)) {
    count += 1;
  }
  return `${root}_${count}`;
}

function reorderByDirection<T extends { order: number }>(
  items: T[],
  index: number,
  direction: 'up' | 'down',
): T[] {
  const next = [...items].sort((a, b) => a.order - b.order);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= next.length) return next;

  const temp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = temp;

  return next.map((item, idx) => ({ ...item, order: idx + 1 }));
}

function updateWorldById(
  layout: NavigationLayout,
  worldId: string,
  updater: (world: NavigationWorld) => NavigationWorld,
): NavigationLayout {
  return {
    ...layout,
    worlds: layout.worlds.map((world) => (world.id === worldId ? updater(world) : world)),
  };
}

function updateSectionById(
  world: NavigationWorld,
  sectionId: string,
  updater: (section: NavigationSection) => NavigationSection,
): NavigationWorld {
  return {
    ...world,
    sections: world.sections.map((section) =>
      section.id === sectionId ? updater(section) : section,
    ),
  };
}

export default function NavigationConfigSection() {
  const { data: serverData, isLoading } = useNavigationLayout();
  const updateMutation = useUpdateNavigationLayout();
  const resetMutation = useResetNavigationLayout();

  const serverLayout = useMemo(
    () => normalizeNavigationLayout(serverData || undefined),
    [serverData],
  );

  const [draftLayout, setDraftLayout] = useState<NavigationLayout>(serverLayout);
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [newWorldName, setNewWorldName] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setDraftLayout(serverLayout);
  }, [serverLayout]);

  const sortedWorlds = useMemo(
    () => [...draftLayout.worlds].sort((a, b) => a.order - b.order),
    [draftLayout.worlds],
  );

  const selectedWorld = useMemo(
    () => sortedWorlds.find((world) => world.id === selectedWorldId) || sortedWorlds[0] || null,
    [selectedWorldId, sortedWorlds],
  );

  const sortedSections = useMemo(
    () =>
      selectedWorld ? [...selectedWorld.sections].sort((a, b) => a.order - b.order) : [],
    [selectedWorld],
  );

  const selectedSection = useMemo(
    () =>
      sortedSections.find((section) => section.id === selectedSectionId) ||
      sortedSections[0] ||
      null,
    [selectedSectionId, sortedSections],
  );

  useEffect(() => {
    if (selectedWorldId && sortedWorlds.some((world) => world.id === selectedWorldId)) return;
    setSelectedWorldId(sortedWorlds[0]?.id || '');
  }, [selectedWorldId, sortedWorlds]);

  useEffect(() => {
    if (
      selectedSectionId &&
      sortedSections.some((section) => section.id === selectedSectionId)
    ) {
      return;
    }
    setSelectedSectionId(sortedSections[0]?.id || '');
  }, [selectedSectionId, sortedSections]);

  const hasChanges =
    JSON.stringify(reindexNavigationLayout(draftLayout)) !==
    JSON.stringify(reindexNavigationLayout(serverLayout));

  const unassignedItems = useMemo(
    () => getUnassignedCatalogItems(draftLayout, NAVIGATION_CATALOG),
    [draftLayout],
  );

  const filteredCatalog = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return NAVIGATION_CATALOG;

    return NAVIGATION_CATALOG.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.path.toLowerCase().includes(term) ||
        item.itemKey.toLowerCase().includes(term),
    );
  }, [searchTerm]);

  const mutateDraft = (updater: (layout: NavigationLayout) => NavigationLayout) => {
    setDraftLayout((current) => reindexNavigationLayout(updater(cloneNavigationLayout(current))));
  };

  const handleAddWorld = () => {
    const name = newWorldName.trim();
    if (!name) return;

    mutateDraft((layout) => {
      const existingIds = new Set(layout.worlds.map((world) => world.id));
      const worldId = buildUniqueId(name, existingIds, 'world');
      layout.worlds.push({
        id: worldId,
        name,
        order: layout.worlds.length + 1,
        enabled: true,
        sections: [],
      });
      return layout;
    });

    setNewWorldName('');
  };

  const handleDeleteWorld = (worldId: string) => {
    mutateDraft((layout) => {
      layout.worlds = layout.worlds.filter((world) => world.id !== worldId);
      return layout;
    });
  };

  const handleMoveWorld = (worldId: string, direction: 'up' | 'down') => {
    mutateDraft((layout) => {
      const ordered = [...layout.worlds].sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((world) => world.id === worldId);
      layout.worlds = reorderByDirection(ordered, index, direction);
      return layout;
    });
  };

  const handleAddSection = () => {
    if (!selectedWorld) return;
    const title = newSectionTitle.trim();
    if (!title) return;

    mutateDraft((layout) =>
      updateWorldById(layout, selectedWorld.id, (world) => {
        const sectionIds = new Set(world.sections.map((section) => section.id));
        const sectionId = buildUniqueId(title, sectionIds, 'section');
        return {
          ...world,
          sections: [
            ...world.sections,
            {
              id: sectionId,
              title,
              order: world.sections.length + 1,
              items: [],
            },
          ],
        };
      }),
    );

    setNewSectionTitle('');
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!selectedWorld) return;

    mutateDraft((layout) =>
      updateWorldById(layout, selectedWorld.id, (world) => ({
        ...world,
        sections: world.sections.filter((section) => section.id !== sectionId),
      })),
    );
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!selectedWorld) return;

    mutateDraft((layout) =>
      updateWorldById(layout, selectedWorld.id, (world) => {
        const ordered = [...world.sections].sort((a, b) => a.order - b.order);
        const index = ordered.findIndex((section) => section.id === sectionId);
        return {
          ...world,
          sections: reorderByDirection(ordered, index, direction),
        };
      }),
    );
  };

  const handleAssignItem = (itemKey: string) => {
    if (!selectedWorld || !selectedSection) return;

    mutateDraft((layout) => {
      const alreadyAssignedSomewhere = layout.worlds.some((world) =>
        world.sections.some((section) =>
          section.items.some((item) => item.itemKey === itemKey),
        ),
      );

      return updateWorldById(layout, selectedWorld.id, (world) =>
        updateSectionById(world, selectedSection.id, (section) => {
          if (section.items.some((item) => item.itemKey === itemKey)) {
            return section;
          }

          const nextItem: NavigationPlacement = {
            itemKey,
            order: section.items.length + 1,
            shortcut: alreadyAssignedSomewhere ? true : undefined,
          };

          return {
            ...section,
            items: [...section.items, nextItem],
          };
        }),
      );
    });
  };

  const handleRemoveItem = (itemKey: string) => {
    if (!selectedWorld || !selectedSection) return;

    mutateDraft((layout) =>
      updateWorldById(layout, selectedWorld.id, (world) =>
        updateSectionById(world, selectedSection.id, (section) => ({
          ...section,
          items: section.items.filter((item) => item.itemKey !== itemKey),
        })),
      ),
    );
  };

  const handleMoveItem = (itemKey: string, direction: 'up' | 'down') => {
    if (!selectedWorld || !selectedSection) return;

    mutateDraft((layout) =>
      updateWorldById(layout, selectedWorld.id, (world) =>
        updateSectionById(world, selectedSection.id, (section) => {
          const ordered = [...section.items].sort((a, b) => a.order - b.order);
          const index = ordered.findIndex((item) => item.itemKey === itemKey);
          return {
            ...section,
            items: reorderByDirection(ordered, index, direction),
          };
        }),
      ),
    );
  };

  const handleSave = async () => {
    const payload = reindexNavigationLayout(draftLayout);
    await updateMutation.mutateAsync(payload);
  };

  const handleCancel = () => {
    setDraftLayout(serverLayout);
  };

  const handleReset = async () => {
    await resetMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando navegacion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Navegacion</h2>
        <p className="text-sm text-gray-600">
          Organiza dominios de negocio, secciones e items sin cambiar rutas ni titulos base.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4 lg:col-span-1">
          <div className="border border-gray-200 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Dominios de negocio</h3>
            <div className="space-y-2">
              {sortedWorlds.map((world) => {
                const isActive = selectedWorld?.id === world.id;
                return (
                  <div
                    key={world.id}
                    className={`border rounded-lg px-3 py-2 ${
                      isActive ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full text-left text-sm font-medium text-gray-900"
                      onClick={() => setSelectedWorldId(world.id)}
                    >
                      {world.name}
                    </button>
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveWorld(world.id, 'up')}
                        className="p-1 rounded border border-gray-200 hover:bg-gray-50"
                        title="Subir dominio"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveWorld(world.id, 'down')}
                        className="p-1 rounded border border-gray-200 hover:bg-gray-50"
                        title="Bajar dominio"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorld(world.id)}
                        className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                        title="Eliminar dominio"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={newWorldName}
                onChange={(e) => setNewWorldName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Nuevo dominio"
              />
              <button
                type="button"
                onClick={handleAddWorld}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Secciones</h3>
            {!selectedWorld && (
              <p className="text-xs text-gray-500">Selecciona un dominio para gestionar secciones.</p>
            )}
            {selectedWorld && (
              <>
                <div className="space-y-2">
                  {sortedSections.map((section) => {
                    const isActive = selectedSection?.id === section.id;
                    return (
                      <div
                        key={section.id}
                        className={`border rounded-lg px-3 py-2 ${
                          isActive ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                        }`}
                      >
                        <button
                          type="button"
                          className="w-full text-left text-sm font-medium text-gray-900"
                          onClick={() => setSelectedSectionId(section.id)}
                        >
                          {section.title}
                        </button>
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveSection(section.id, 'up')}
                            className="p-1 rounded border border-gray-200 hover:bg-gray-50"
                            title="Subir seccion"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(section.id, 'down')}
                            className="p-1 rounded border border-gray-200 hover:bg-gray-50"
                            title="Bajar seccion"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSection(section.id)}
                            className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                            title="Eliminar seccion"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Nueva seccion"
                  />
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Items en seccion</h3>
              {selectedSection && (
                <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                  {selectedSection.title}
                </span>
              )}
            </div>

            {!selectedSection && (
              <p className="text-xs text-gray-500">Selecciona una seccion para asignar items.</p>
            )}

            {selectedSection && (
              <div className="space-y-2">
                {[...selectedSection.items]
                  .sort((a, b) => a.order - b.order)
                  .map((placement) => {
                    const catalogItem = NAVIGATION_CATALOG_BY_KEY[placement.itemKey];
                    return (
                      <div
                        key={placement.itemKey}
                        className="border border-gray-200 rounded-lg p-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {catalogItem?.title || placement.itemKey}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {catalogItem?.path || placement.itemKey}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {placement.shortcut && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                              Atajo
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleMoveItem(placement.itemKey, 'up')}
                            className="p-1 rounded border border-gray-200 hover:bg-gray-50"
                            title="Subir item"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(placement.itemKey, 'down')}
                            className="p-1 rounded border border-gray-200 hover:bg-gray-50"
                            title="Bajar item"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(placement.itemKey)}
                            className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                            title="Quitar item"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {selectedSection.items.length === 0 && (
                  <p className="text-xs text-gray-500">No hay items asignados en esta seccion.</p>
                )}
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Catalogo de items</h3>
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                Sin asignar: {unassignedItems.length}
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Buscar por titulo, ruta o clave"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {filteredCatalog.map((item) => {
                const existsInCurrentSection =
                  selectedSection?.items.some(
                    (placement) => placement.itemKey === item.itemKey,
                  ) || false;
                const isUnassigned = unassignedItems.some(
                  (candidate) => candidate.itemKey === item.itemKey,
                );

                return (
                  <div
                    key={item.itemKey}
                    className="border border-gray-200 rounded-lg p-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {item.isKnownCoreItem ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                            Core
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                            Nuevo
                          </span>
                        )}
                        {isUnassigned && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            Sin asignar
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{item.path}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssignItem(item.itemKey)}
                      disabled={!selectedSection || existsInCurrentSection}
                      className="px-2.5 py-1.5 text-xs rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {existsInCurrentSection ? 'Asignado' : 'Agregar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? 'Guardando...' : 'Guardar navegacion'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={!hasChanges || updateMutation.isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancelar cambios
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetMutation.isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          {resetMutation.isPending ? 'Restaurando...' : 'Restaurar base'}
        </button>
      </div>
    </div>
  );
}

