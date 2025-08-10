'use client';

import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  User,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import {
  usePersonas,
  useCreatePersona,
  useUpdatePersona,
  useDeletePersona,
  usePersonasSummary
} from '@/hooks/usePersonas';
import { useActiveRoles } from '@/hooks/useRoles';
import { Persona, CreatePersonaDto } from '@/types';
import MainLayout from '@/components/layout/MainLayout';

interface FormData extends CreatePersonaDto {
  horasTotales?: number;
  aportesTotales?: number;
  inversionHoras?: number;
  inversionTotal?: number;
  activo?: boolean;
}

export default function PersonasPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    rolId: 0,
    participacionPorc: 0,
    valorHora: 0,
    notas: '',
  });

  // React Query hooks
  const { data: personas = [], isLoading, error } = usePersonas(includeInactive);
  const { data: roles = [] } = useActiveRoles();
  const { data: summary } = usePersonasSummary();
  const createMutation = useCreatePersona();
  const updateMutation = useUpdatePersona();
  const deleteMutation = useDeletePersona();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPersona) {
      await updateMutation.mutateAsync({ id: editingPersona.id, data: formData });
      setEditingPersona(null);
    } else {
      await createMutation.mutateAsync(formData);
      setIsCreateModalOpen(false);
    }

    resetForm();
  };

  const handleEdit = (persona: Persona) => {
    setFormData({
      nombre: persona.nombre,
      rolId: persona.rolId,
      participacionPorc: persona.participacionPorc,
      valorHora: persona.valorHora,
      horasTotales: persona.horasTotales,
      aportesTotales: persona.aportesTotales,
      inversionHoras: persona.inversionHoras,
      inversionTotal: persona.inversionTotal,
      notas: persona.notas || '',
      activo: persona.activo,
    });
    setEditingPersona(persona);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta persona?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      rolId: 0,
      participacionPorc: 0,
      valorHora: 0,
      notas: '',
    });
    setEditingPersona(null);
    setIsCreateModalOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRolName = (rolId: number) => {
    const rol = roles.find(r => r.id === rolId);
    return rol?.nombreRol || 'Rol no encontrado';
  };

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Personas</h1>
          <p className="text-sm text-gray-600">Administra el personal del sistema</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Incluir inactivos
          </label>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Persona
          </button>
        </div>

        {/* Summary Cards */}
        {summary && summary.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Personas</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.data.totalPersonas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participación Total</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.data.totalParticipacion}%</p>
                  <p className="text-xs text-gray-500">Disponible: {summary.data.participacionDisponible}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.data.horasTotales?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inversión Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.data.inversionTotal)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">Error cargando personas: {error.message}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando personas...</p>
            </div>
          )}

          {/* Personas Table */}
          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal del Sistema ({personas.length})
                </h2>
              </div>

              {personas.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay personas</h3>
                  <p className="text-gray-600 mb-4">Comienza agregando tu primera persona</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Agregar Primera Persona
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Persona
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Hora
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inversión
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {personas.map((persona) => (
                        <tr key={persona.id} className={`hover:bg-gray-50 ${!persona.activo ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900">{persona.nombre}</div>
                              {persona.notas && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">{persona.notas}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {getRolName(persona.rolId)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {persona.participacionPorc}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(persona.valorHora)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(persona.inversionTotal)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              persona.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {persona.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(persona)}
                                className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(persona.id)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {(isCreateModalOpen || editingPersona) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingPersona ? 'Editar Persona' : 'Crear Nueva Persona'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre completo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol *
                    </label>
                    <select
                      value={formData.rolId}
                      onChange={(e) => setFormData({ ...formData, rolId: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value={0}>Selecciona un rol</option>
                      {roles.map(rol => (
                        <option key={rol.id} value={rol.id}>
                          {rol.nombreRol} ({rol.importancia}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Participación (%) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.participacionPorc}
                      onChange={(e) => setFormData({ ...formData, participacionPorc: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {summary && summary.data && (
                      <p className="text-xs text-gray-500 mt-1">
                        Disponible: {summary.data.participacionDisponible}%
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Hora (COP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.valorHora || ''}
                      onChange={(e) => setFormData({ ...formData, valorHora: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {editingPersona && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horas Totales
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.horasTotales || ''}
                        onChange={(e) => setFormData({ ...formData, horasTotales: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aportes Totales (COP)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.aportesTotales || ''}
                        onChange={(e) => setFormData({ ...formData, aportesTotales: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inversión Horas
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.inversionHoras || ''}
                        onChange={(e) => setFormData({ ...formData, inversionHoras: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inversión Total (COP)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.inversionTotal || ''}
                        onChange={(e) => setFormData({ ...formData, inversionTotal: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.activo ?? true}
                          onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Persona activa</span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    value={formData.notas || ''}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Información adicional sobre la persona..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : (editingPersona ? 'Actualizar' : 'Crear')}
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
