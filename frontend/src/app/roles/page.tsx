'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  Download,
  RotateCcw,
  Search,
  RefreshCw,
  X,
  Save,
  BarChart3,
  TrendingUp,
  Info,
  Lightbulb,
  Shield,
  Target,
  Award
} from 'lucide-react';
import {
  useRoles,
  useCreateRol,
  useUpdateRol,
  useDeleteRol
} from '@/hooks/useRoles';
import { useUsuarios } from '@/hooks/useUsuarios';
import { Rol, CreateRolDto } from '@/types';
import MainLayout from '@/components/layout/MainLayout';

interface FormData {
  nombreRol: string;
  importancia: number;
  descripcion: string;
}

interface EditFormData extends Rol {
  // Campos adicionales para edición
}

export default function RolesPage() {
  const [formData, setFormData] = useState<FormData>({
    nombreRol: '',
    importancia: 0,
    descripcion: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRol, setEditingRol] = useState<EditFormData | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // React Query hooks
  const { data: roles = [], isLoading, error, refetch } = useRoles();
  const { data: usuarios = [], isLoading: usuariosLoading } = useUsuarios();
  const createMutation = useCreateRol();
  const updateMutation = useUpdateRol();
  const deleteMutation = useDeleteRol();

  // Debug logs
  useEffect(() => {
    console.log('RolesPage - Debug Info:', {
      roles,
      usuarios,
      isLoading,
      usuariosLoading,
      error,
      rolesLength: roles.length,
      usuariosLength: usuarios?.length || 0
    });
  }, [roles, usuarios, isLoading, usuariosLoading, error]);

  // Filtrar roles por búsqueda
  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;
    return roles.filter(rol =>
      rol.nombreRol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalRoles = roles.length;
    const importanciaTotal = roles.reduce((acc, rol) => acc + (rol.importancia || 0), 0);
    const usuariosAsignados = (usuarios || []).filter(u => u.rolId && u.rolId > 0).length;

    return {
      totalRoles,
      importanciaTotal,
      usuariosAsignados
    };
  }, [roles, usuarios]);

  // Contar usuarios por rol
  const getUsuariosCount = (rolId: number) => {
    return (usuarios || []).filter(u => u.rolId === rolId).length;
  };

  // Agregar nuevo rol
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombreRol.trim()) {
      alert('Debe ingresar un nombre de rol');
      return;
    }

    if (formData.importancia < 0 || formData.importancia > 100) {
      alert('La importancia debe estar entre 0 y 100');
      return;
    }

    // Verificar duplicados
    const existe = roles.some(r => r.nombreRol.toLowerCase() === formData.nombreRol.toLowerCase());
    if (existe) {
      alert('Ya existe un rol con ese nombre');
      return;
    }

    try {
      await createMutation.mutateAsync({
        nombreRol: formData.nombreRol.trim(),
        importancia: formData.importancia,
        descripcion: formData.descripcion
      });

      // Limpiar formulario
      setFormData({
        nombreRol: '',
        importancia: 0,
        descripcion: ''
      });
    } catch (error) {
      console.error('Error al crear rol:', error);
    }
  };

  // Abrir modal de edición
  const handleEdit = (rol: Rol) => {
    setEditingRol({
      ...rol,
      descripcion: rol.descripcion || ''
    });
    setIsEditModalOpen(true);
  };

  // Guardar edición
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRol) return;

    try {
      await updateMutation.mutateAsync({
        id: editingRol.id,
        data: {
          nombreRol: editingRol.nombreRol,
          importancia: editingRol.importancia,
          descripcion: editingRol.descripcion
        }
      });
      setIsEditModalOpen(false);
      setEditingRol(null);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
    }
  };

  // Cerrar modal de edición
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRol(null);
  };

  // Eliminar rol
  const handleDelete = async (rol: Rol) => {
    // Verificar si hay usuarios con este rol
    const usuariosConRol = (usuarios || []).filter(u => u.rolId === rol.id);

    if (usuariosConRol.length > 0) {
      alert(`No se puede eliminar: ${usuariosConRol.length} usuario(s) tienen este rol asignado`);
      return;
    }

    const confirmed = confirm(`¿Estás seguro de eliminar el rol "${rol.nombreRol}"?`);
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(rol.id);
    } catch (error) {
      console.error('Error al eliminar rol:', error);
    }
  };

  // Exportar a CSV
  const exportarRoles = () => {
    const datosExportar = roles.map(rol => ({
      ID: rol.id,
      'Nombre del Rol': rol.nombreRol,
      'Importancia (%)': rol.importancia,
      'Descripción': rol.descripcion || '',
      'Usuarios Asignados': getUsuariosCount(rol.id)
    }));

    // Crear CSV
    const headers = Object.keys(datosExportar[0] || {});
    const csvContent = [
      headers.join(','),
      ...datosExportar.map(row =>
        headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
      )
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'roles_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recalcular datos
  const recalcularTodo = async () => {
    setIsRecalculating(true);
    try {
      await refetch();
      alert('Sistema recalculado');
    } catch (error) {
      console.error('Error al recalcular:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Refrescar tabla
  const refreshTable = () => {
    refetch();
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="text-indigo-600" size={28} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
              </div>
              <p className="text-gray-600 ml-12">Define roles y su porcentaje de importancia en la distribución de utilidades</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={exportarRoles}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
              <button
                onClick={recalcularTodo}
                disabled={isRecalculating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                {isRecalculating ? 'Recalculando...' : 'Recalcular'}
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <BarChart3 className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRoles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Importancia Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.importanciaTotal}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Users className="text-amber-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Usuarios Asignados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.usuariosAsignados}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Agregar Rol */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Agregar Nuevo Rol</h3>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="rol-nombreRol" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Rol *
              </label>
              <input
                type="text"
                id="rol-nombreRol"
                value={formData.nombreRol}
                onChange={(e) => setFormData({ ...formData, nombreRol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                placeholder="Ej: Director"
                required
              />
            </div>

            <div>
              <label htmlFor="rol-importancia" className="block text-sm font-medium text-gray-700 mb-2">
                Importancia (%) *
              </label>
              <input
                type="number"
                id="rol-importancia"
                value={formData.importancia}
                onChange={(e) => setFormData({ ...formData, importancia: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                placeholder="40"
                min="0"
                max="100"
                required
              />
            </div>

            <div>
              <label htmlFor="rol-descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                id="rol-descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                placeholder="Gestión general..."
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                {createMutation.isPending ? 'Agregando...' : 'Agregar Rol'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de Roles */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="text-blue-600" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Listado de Roles ({filteredRoles.length})
                </h2>
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    placeholder="Buscar roles..."
                  />
                </div>
                <button
                  onClick={refreshTable}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refrescar
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">Error cargando roles: {error.message}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando roles...</p>
            </div>
          )}

          {/* Roles Table */}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importancia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuarios
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {searchTerm ? 'No se encontraron roles' : 'No hay roles'}
                        </h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primer rol'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((rol) => (
                      <tr key={rol.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">#{rol.id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 rounded">
                              <Shield className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <span className="font-medium text-gray-900">{rol.nombreRol}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            <Target className="h-3 w-3" />
                            {rol.importancia}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {rol.descripcion || 'Sin descripción'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Users className="h-3 w-3" />
                            {getUsuariosCount(rol.id)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(rol)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(rol)}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Información Adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="text-blue-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Información sobre Roles</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Los roles definen la importancia de cada usuario en el negocio.</p>
              <p>• El porcentaje de importancia afecta directamente la distribución de utilidades.</p>
              <p>• La suma de importancias no necesariamente debe ser 100%.</p>
              <p>• Cada usuario debe tener un rol asignado para participar en distribuciones.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Lightbulb className="text-amber-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sugerencias de Roles</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Director/CEO</span>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-medium">40-50%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Gerente/Manager</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-medium">25-35%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Especialista</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">15-25%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-gray-900">Asistente</span>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium">10-20%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Edición */}
        {isEditModalOpen && editingRol && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Edit className="text-indigo-600" size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Editar Rol
                  </h3>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Rol *
                  </label>
                  <input
                    type="text"
                    value={editingRol.nombreRol}
                    onChange={(e) => setEditingRol({ ...editingRol, nombreRol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importancia (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingRol.importancia}
                    onChange={(e) => setEditingRol({ ...editingRol, importancia: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={editingRol.descripcion}
                    onChange={(e) => setEditingRol({ ...editingRol, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    rows={3}
                    placeholder="Describe las responsabilidades del rol..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
