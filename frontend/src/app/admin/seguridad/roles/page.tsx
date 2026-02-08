'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Check,
  X,
  Save,
  ChevronDown,
  ChevronRight,
  Lock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { SecurityService, SecurityRole, Permission, CreateRoleDto, UpdateRoleDto } from '@/services/security.service';
import MainLayout from '@/components/layout/MainLayout';

// Permission category labels in Spanish
const CATEGORY_LABELS: Record<string, string> = {
  users: 'Usuarios',
  security: 'Seguridad',
  hours: 'Gestión de Horas',
  finance: 'Finanzas',
  operations: 'Operaciones',
  reports: 'Reportes',
  settings: 'Configuración',
  system: 'Sistema',
};

// Color options for roles
const ROLE_COLORS = [
  { value: '#6366f1', label: 'Indigo', class: 'bg-indigo-500' },
  { value: '#10b981', label: 'Verde', class: 'bg-green-500' },
  { value: '#f59e0b', label: 'Amarillo', class: 'bg-amber-500' },
  { value: '#ef4444', label: 'Rojo', class: 'bg-red-500' },
  { value: '#8b5cf6', label: 'Púrpura', class: 'bg-purple-500' },
  { value: '#3b82f6', label: 'Azul', class: 'bg-blue-500' },
  { value: '#ec4899', label: 'Rosa', class: 'bg-pink-500' },
  { value: '#6b7280', label: 'Gris', class: 'bg-gray-500' },
];

const ACTION_LABELS: Record<string, string> = {
  read: 'Consultar',
  create: 'Crear',
  update: 'Actualizar',
  delete: 'Eliminar',
  manage: 'Gestionar',
  approve: 'Aprobar',
  reject: 'Rechazar',
  export: 'Exportar',
};

function sanitizeMojibake(value?: string | null): string {
  if (!value) return '';
  let text = value;
  for (let i = 0; i < 2; i += 1) {
    if (!/[\u00C3\u00C2]/.test(text)) break;
    try {
      text = decodeURIComponent(escape(text));
    } catch {
      break;
    }
  }
  return text;
}

function buildPermissionDescription(permission: Permission): string {
  const normalized = sanitizeMojibake(permission.description);
  if (normalized && normalized.trim().length > 0) {
    return normalized;
  }

  const verb = ACTION_LABELS[permission.action] || permission.action;
  const route = permission.route || `/${permission.resource.toLowerCase()}`;
  const deps = Array.isArray(permission.dependencies) && permission.dependencies.length > 0
    ? permission.dependencies.join(', ')
    : 'sin dependencias';
  return `Permite ${verb.toLowerCase()} en ${route}. Requiere ${deps}.`;
}

function getPermissionDependencies(permission: Permission): string[] {
  if (!Array.isArray(permission.dependencies)) return [];
  return permission.dependencies.map((dep) => sanitizeMojibake(dep)).filter(Boolean);
}

export default function SecurityRolesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<CreateRoleDto>({
    name: '',
    description: '',
    color: '#6366f1',
    priority: 0,
    active: true,
  });

  // Queries
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['security-roles'],
    queryFn: SecurityService.getRoles,
  });

  const { data: permissionsByCategory = {}, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions-by-category'],
    queryFn: SecurityService.getPermissionsByCategory,
  });

  const selectedRole = selectedRoleId ? roles.find(r => r.id === selectedRoleId) : null;

  // Update form and permissions when role changes
  useEffect(() => {
    if (selectedRole) {
      setFormData({
        name: selectedRole.name,
        description: selectedRole.description || '',
        color: selectedRole.color || '#6366f1',
        priority: selectedRole.priority,
        active: selectedRole.active,
      });
      setSelectedPermissions(new Set(selectedRole.permissions.map(p => p.permissionId)));
    } else if (!isCreating) {
      setFormData({
        name: '',
        description: '',
        color: '#6366f1',
        priority: 0,
        active: true,
      });
      setSelectedPermissions(new Set());
    }
  }, [selectedRole, isCreating]);

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: SecurityService.createRole,
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['security-roles'] });
      setSelectedRoleId(newRole.id);
      setIsCreating(false);
      toast.success('Rol creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear el rol');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateRoleDto }) =>
      SecurityService.updateRole(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-roles'] });
      toast.success('Rol actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el rol');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: SecurityService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-roles'] });
      setSelectedRoleId(null);
      toast.success('Rol eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el rol');
    },
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      SecurityService.assignPermissions(roleId, { permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-roles'] });
      toast.success('Permisos actualizados exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al asignar permisos');
    },
  });

  // Handlers
  const handleCreateNew = () => {
    setSelectedRoleId(null);
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      color: '#6366f1',
      priority: 0,
      active: true,
    });
    setSelectedPermissions(new Set());
    // Expand all categories
    setExpandedCategories(new Set(Object.keys(permissionsByCategory)));
  };

  const handleSaveRole = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del rol es requerido');
      return;
    }

    if (isCreating) {
      createRoleMutation.mutate(formData);
    } else if (selectedRoleId) {
      updateRoleMutation.mutate({ id: selectedRoleId, dto: formData });
    }
  };

  const handleSavePermissions = () => {
    if (selectedRoleId) {
      assignPermissionsMutation.mutate({
        roleId: selectedRoleId,
        permissionIds: Array.from(selectedPermissions),
      });
    }
  };

  const handleDeleteRole = () => {
    if (selectedRoleId && confirm('¿Estás seguro de eliminar este rol? Esta acción no se puede deshacer.')) {
      deleteRoleMutation.mutate(selectedRoleId);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermission = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleAllInCategory = (category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const allSelected = categoryPermissions.every(p => selectedPermissions.has(p.id));

    const newSelected = new Set(selectedPermissions);
    categoryPermissions.forEach(p => {
      if (allSelected) {
        newSelected.delete(p.id);
      } else {
        newSelected.add(p.id);
      }
    });
    setSelectedPermissions(newSelected);
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="text-indigo-600" size={28} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Roles y Permisos</h1>
            </div>
            <p className="text-gray-600 ml-12">
              Gestiona los roles de seguridad y asigna permisos específicos
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo Rol
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Roles Disponibles</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  setSelectedRoleId(role.id);
                  setIsCreating(false);
                }}
                className={`w-full px-6 py-4 text-left transition-colors ${
                  selectedRoleId === role.id
                    ? 'bg-indigo-50 border-l-4 border-indigo-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: role.color || '#6366f1' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{role.name}</span>
                      {role.isSystem && (
                        <Lock className="h-3 w-3 text-gray-400" title="Rol del sistema" />
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-gray-500 truncate">{sanitizeMojibake(role.description)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    {role._count?.users || 0}
                  </div>
                </div>
              </button>
            ))}
            {roles.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay roles creados
              </div>
            )}
          </div>
        </div>

        {/* Role Details & Permissions */}
        <div className="lg:col-span-2 space-y-6">
          {(selectedRole || isCreating) ? (
            <>
              {/* Role Form */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isCreating ? 'Crear Nuevo Rol' : 'Editar Rol'}
                  </h2>
                  {selectedRole && !selectedRole.isSystem && (
                    <button
                      onClick={handleDeleteRole}
                      className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  )}
                </div>

                {selectedRole?.isSystem && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-800 text-sm">
                      Este es un rol del sistema. El nombre no puede ser modificado.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={selectedRole?.isSystem}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Nombre del rol"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Descripción del rol"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {ROLE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`w-8 h-8 rounded-full ${color.class} ${
                            formData.color === color.value
                              ? 'ring-2 ring-offset-2 ring-indigo-600'
                              : ''
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Rol activo</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveRole}
                    disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isCreating ? 'Crear Rol' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>

              {/* Permissions - Only show for existing roles */}
              {selectedRole && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Permisos del Rol</h2>
                    <button
                      onClick={handleSavePermissions}
                      disabled={assignPermissionsMutation.isPending}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Guardar Permisos
                    </button>
                  </div>

                  <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                    {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                      const isExpanded = expandedCategories.has(category);
                      const categoryPerms = permissions as Permission[];
                      const allSelected = categoryPerms.every(p => selectedPermissions.has(p.id));
                      const someSelected = categoryPerms.some(p => selectedPermissions.has(p.id));

                      return (
                        <div key={category}>
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="font-medium text-gray-900">
                                {CATEGORY_LABELS[category] || category}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({categoryPerms.filter(p => selectedPermissions.has(p.id)).length}/{categoryPerms.length})
                              </span>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                allSelected
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : someSelected
                                  ? 'bg-gray-200 text-gray-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {allSelected ? 'Todo seleccionado' : someSelected ? 'Parcial' : 'Sin seleccionar'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="px-6 py-2 space-y-2">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => toggleAllInCategory(category)}
                                  className={`px-2 py-1 text-xs rounded ${
                                    allSelected
                                      ? 'bg-indigo-100 text-indigo-700'
                                      : someSelected
                                      ? 'bg-gray-200 text-gray-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {allSelected ? 'Desmarcar todo' : 'Seleccionar todo'}
                                </button>
                              </div>
                              {categoryPerms.map((permission) => (
                                <label
                                  key={permission.id}
                                  className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedPermissions.has(permission.id)}
                                    onChange={() => togglePermission(permission.id)}
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900 truncate">
                                        {buildPermissionDescription(permission)}
                                      </span>
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                        {ACTION_LABELS[permission.action] || permission.action}
                                      </span>
                                      <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                                        {permission.code}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-2">
                                      <span>{permission.subject}</span>
                                      <span>•</span>
                                      <span>{permission.route || 'Sin ruta principal'}</span>
                                      <span>•</span>
                                      <span>
                                        Dependencias: {getPermissionDependencies(permission).length > 0
                                          ? getPermissionDependencies(permission).join(', ')
                                          : 'Sin dependencias'}
                                      </span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona un rol
              </h3>
              <p className="text-gray-500 mb-4">
                Selecciona un rol de la lista para ver y editar sus permisos,
                o crea uno nuevo.
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Crear Nuevo Rol
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
