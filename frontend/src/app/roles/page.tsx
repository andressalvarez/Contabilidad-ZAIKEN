'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  User,
  TrendingUp,
  Clock,
  DollarSign,
  Download,
  RotateCcw,
  Search,
  RefreshCw,
  X,
  Save,
  BarChart3,
  CheckCircle2,
  Info,
  Lightbulb
} from 'lucide-react';
import {
  useRoles,
  useCreateRol,
  useUpdateRol,
  useDeleteRol
} from '@/hooks/useRoles';
import { usePersonas } from '@/hooks/usePersonas';
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
  const { data: personas = [], isLoading: personasLoading } = usePersonas(true);
  const createMutation = useCreateRol();
  const updateMutation = useUpdateRol();
  const deleteMutation = useDeleteRol();

  // Debug logs
  useEffect(() => {
    console.log('RolesPage - Debug Info:', {
      roles,
      personas,
      isLoading,
      personasLoading,
      error,
      rolesLength: roles.length,
      personasLength: personas?.length || 0
    });
  }, [roles, personas, isLoading, personasLoading, error]);

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
    const personasAsignadas = (personas || []).filter(p => p.rolId && p.rolId > 0).length;

    return {
      totalRoles,
      importanciaTotal,
      personasAsignadas
    };
  }, [roles, personas]);

  // Contar personas por rol
  const getPersonasCount = (rolId: number) => {
    return (personas || []).filter(p => p.rolId === rolId).length;
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
    // Verificar si hay personas con este rol
    const personasConRol = (personas || []).filter(p => p.rolId === rol.id);

    if (personasConRol.length > 0) {
      alert(`No se puede eliminar: ${personasConRol.length} persona(s) tienen este rol asignado`);
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
      'Personas Asignadas': getPersonasCount(rol.id)
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
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Roles</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Define roles y su porcentaje de importancia en la distribución de utilidades
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={exportarRoles}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
            <button
              onClick={recalcularTodo}
              disabled={isRecalculating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Recalculando...' : 'Recalcular'}
            </button>
          </div>
        </div>

        {/* Formulario de Agregar Rol */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            <Plus className="inline h-5 w-5 mr-2" />
            Agregar Nuevo Rol
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="rol-nombreRol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Rol:
              </label>
              <input
                type="text"
                id="rol-nombreRol"
                value={formData.nombreRol}
                onChange={(e) => setFormData({ ...formData, nombreRol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ej: Director"
                required
              />
            </div>

            <div>
              <label htmlFor="rol-importancia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Importancia (%):
              </label>
              <input
                type="number"
                id="rol-importancia"
                value={formData.importancia}
                onChange={(e) => setFormData({ ...formData, importancia: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="40"
                min="0"
                max="100"
                required
              />
            </div>

            <div>
              <label htmlFor="rol-descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción:
              </label>
              <input
                type="text"
                id="rol-descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Gestión general..."
              />
            </div>

            <div className="flex items-end">
          <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
                <Plus className="h-4 w-4 mr-2" />
                {createMutation.isPending ? 'Agregando...' : 'Agregar Rol'}
          </button>
            </div>
          </form>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 opacity-80" />
              </div>
              <div className="ml-4">
                <p className="text-indigo-100 text-sm font-medium">Total Roles</p>
                <p className="text-2xl font-bold">{stats.totalRoles}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
              <div className="ml-4">
                <p className="text-emerald-100 text-sm font-medium">Importancia Total</p>
                <p className="text-2xl font-bold">{stats.importanciaTotal}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 opacity-80" />
              </div>
              <div className="ml-4">
                <p className="text-amber-100 text-sm font-medium">Personas Asignadas</p>
                <p className="text-2xl font-bold">{stats.personasAsignadas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Roles */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              <BarChart3 className="inline h-5 w-5 mr-2" />
              Listado de Roles
            </h3>
            <div className="mt-2 sm:mt-0 flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Buscar roles..."
                />
              </div>
              <button
                onClick={refreshTable}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refrescar
              </button>
            </div>
          </div>

        {/* Error State */}
        {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-6 my-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Error cargando roles: {error.message}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando roles...</p>
          </div>
        )}

        {/* Roles Table */}
        {!isLoading && !error && (
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ID
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nombre del Rol
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Importancia (%)
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Descripción
                      </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {searchTerm ? 'No se encontraron roles' : 'No hay roles'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primer rol'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((rol) => (
                      <tr key={rol.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {rol.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">{rol.nombreRol}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {rol.importancia}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {rol.descripcion || 'Sin descripción'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(rol)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(rol)}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900"
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
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              <Info className="inline h-5 w-5 mr-2" />
              Información sobre Roles
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>• Los roles definen la importancia de cada persona en el negocio.</p>
              <p>• El porcentaje de importancia afecta directamente la distribución de utilidades.</p>
              <p>• La suma de importancias no necesariamente debe ser 100%.</p>
              <p>• Cada persona debe tener un rol asignado para participar en distribuciones.</p>
            </div>
      </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              <Lightbulb className="inline h-5 w-5 mr-2" />
              Sugerencias de Roles
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm">Director/CEO</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">40-50%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm">Gerente/Manager</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded dark:bg-green-900 dark:text-green-200">25-35%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm">Especialista</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded dark:bg-yellow-900 dark:text-yellow-200">15-25%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm">Asistente</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded dark:bg-purple-900 dark:text-purple-200">10-20%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Edición */}
        {isEditModalOpen && editingRol && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Editar Rol: {editingRol.nombreRol}
                </h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Rol *
                </label>
                <input
                  type="text"
                    value={editingRol.nombreRol}
                    onChange={(e) => setEditingRol({ ...editingRol, nombreRol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Importancia (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                    value={editingRol.importancia}
                    onChange={(e) => setEditingRol({ ...editingRol, importancia: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                </label>
                <textarea
                    value={editingRol.descripcion}
                    onChange={(e) => setEditingRol({ ...editingRol, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  placeholder="Describe las responsabilidades del rol..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-4 w-4 mr-2" />
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
