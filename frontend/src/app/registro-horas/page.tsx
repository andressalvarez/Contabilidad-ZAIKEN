'use client'

import { useState, useMemo, useEffect } from 'react';
import { useRegistroHoras, useCreateRegistroHoras, useUpdateRegistroHoras, useDeleteRegistroHoras } from '@/hooks/useRegistroHoras';
import { usePersonas } from '@/hooks/usePersonas';
import { useCampanas } from '@/hooks/useCampanas';
import MainLayout from '@/components/layout/MainLayout';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { RegistroHoras, CreateRegistroHorasDto } from '@/types';
import { toast } from 'react-hot-toast';

interface FormData {
  fecha: string;
  personaId: number;
  campanaId: number;
  horas: number;
  descripcion: string;
}

export default function RegistroHorasPage() {
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date().toISOString().split('T')[0],
    personaId: 0,
    campanaId: 0,
    horas: 0,
    descripcion: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<RegistroHoras>>({});

  // React Query hooks
  const { data: registrosHoras = [], isLoading, error, refetch } = useRegistroHoras();
  const { data: personas = [] } = usePersonas(true);
  const { data: campanas = [] } = useCampanas();
  const createMutation = useCreateRegistroHoras();
  const updateMutation = useUpdateRegistroHoras();
  const deleteMutation = useDeleteRegistroHoras();

  // Debug logs
  useEffect(() => {
    console.log('RegistroHorasPage - Debug Info:', {
      registrosHoras,
      personas,
      campanas,
      isLoading,
      error,
      registrosHorasLength: registrosHoras.length,
      personasLength: personas?.length || 0,
      campanasLength: campanas?.length || 0
    });
  }, [registrosHoras, personas, campanas, isLoading, error]);

  // Obtener nombre de la persona
  const getPersonaName = (personaId: number) => {
    const persona = (personas || []).find(p => p.id === personaId);
    return persona?.nombre || 'Persona no encontrada';
  };

  // Obtener nombre de la campaña
  const getCampanaName = (campanaId: number) => {
    const campana = (campanas || []).find(c => c.id === campanaId);
    return campana?.nombre || 'Sin campaña';
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  // Agregar nuevo registro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.personaId || !formData.horas) {
      toast.error('Debe ingresar Persona y Horas');
      return;
    }

    try {
      const createData: CreateRegistroHorasDto = {
        personaId: formData.personaId,
        campanaId: formData.campanaId || undefined,
        fecha: formData.fecha,
        horas: formData.horas,
        descripcion: formData.descripcion
      };

      await createMutation.mutateAsync(createData);

      // Limpiar formulario
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        personaId: 0,
        campanaId: 0,
        horas: 0,
        descripcion: ''
      });
    } catch (error) {
      console.error('Error al crear registro de horas:', error);
    }
  };

  // Iniciar edición
  const handleEdit = (registroHoras: RegistroHoras) => {
    setEditingId(registroHoras.id);
    setEditingData({
      personaId: registroHoras.personaId,
      campanaId: registroHoras.campanaId,
      fecha: registroHoras.fecha,
      horas: registroHoras.horas,
      descripcion: registroHoras.descripcion
    });
  };

  // Guardar edición
  const handleSaveEdit = async (registroHoras: RegistroHoras) => {
    try {
      await updateMutation.mutateAsync({
        id: registroHoras.id,
        data: editingData
      });
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      console.error('Error al actualizar registro de horas:', error);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // Eliminar registro
  const handleDelete = async (registroHoras: RegistroHoras) => {
    const confirmed = confirm(`¿Eliminar registro de ${registroHoras.horas} horas?`);
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(registroHoras.id);
    } catch (error) {
      console.error('Error al eliminar registro de horas:', error);
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6 p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800">Error cargando registros de horas</h3>
            <p className="text-red-600 mt-1">{error.message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de Horas</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Control de tiempo trabajado por persona
            </p>
          </div>
        </div>

        {/* Formulario de Agregar Registro */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            <Plus className="inline h-5 w-5 mr-2" />
            Agregar Nuevo Registro de Horas
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Persona *
                </label>
                <select
                  value={formData.personaId}
                  onChange={(e) => setFormData(prev => ({ ...prev, personaId: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleccionar persona</option>
                  {(personas || []).map(persona => (
                    <option key={persona.id} value={persona.id}>
                      {persona.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaña
                </label>
                <select
                  value={formData.campanaId}
                  onChange={(e) => setFormData(prev => ({ ...prev, campanaId: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sin campaña</option>
                  {(campanas || []).map(campana => (
                    <option key={campana.id} value={campana.id}>
                      {campana.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Horas *
                </label>
                <input
                  type="number"
                  value={formData.horas}
                  onChange={(e) => setFormData(prev => ({ ...prev, horas: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="0"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Notas adicionales"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createMutation.isPending ? 'Agregando...' : 'Agregar Registro'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de Registros de Horas */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Registros de Horas
            </h3>
          </div>

            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Persona
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Campaña
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Horas
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Notas
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Cargando registros de horas...
                    </td>
                  </tr>
                ) : registrosHoras.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron registros de horas
                    </td>
                  </tr>
                ) : (
                  registrosHoras.map((registroHoras) => (
                    <tr key={registroHoras.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {registroHoras.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {editingId === registroHoras.id ? (
                          <input
                            type="date"
                            value={editingData.fecha || registroHoras.fecha}
                            onChange={(e) => setEditingData(prev => ({ ...prev, fecha: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          formatDate(registroHoras.fecha)
                        )}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {editingId === registroHoras.id ? (
                          <select
                            value={editingData.personaId || registroHoras.personaId}
                            onChange={(e) => setEditingData(prev => ({ ...prev, personaId: parseInt(e.target.value) || 0 }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            {(personas || []).map(persona => (
                              <option key={persona.id} value={persona.id}>
                                {persona.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          getPersonaName(registroHoras.personaId)
                        )}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {editingId === registroHoras.id ? (
                          <select
                            value={editingData.campanaId || registroHoras.campanaId || 0}
                            onChange={(e) => setEditingData(prev => ({ ...prev, campanaId: parseInt(e.target.value) || 0 }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            <option value="">Sin campaña</option>
                            {(campanas || []).map(campana => (
                              <option key={campana.id} value={campana.id}>
                                {campana.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          getCampanaName(registroHoras.campanaId || 0)
                        )}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {editingId === registroHoras.id ? (
                          <input
                            type="number"
                            value={editingData.horas || registroHoras.horas}
                            onChange={(e) => setEditingData(prev => ({ ...prev, horas: parseFloat(e.target.value) || 0 }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            min="0"
                            step="0.5"
                          />
                        ) : (
                          `${registroHoras.horas} horas`
                        )}
                    </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {editingId === registroHoras.id ? (
                          <input
                            type="text"
                            value={editingData.descripcion || registroHoras.descripcion || ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, descripcion: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Notas"
                          />
                        ) : (
                          registroHoras.descripcion || '-'
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === registroHoras.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveEdit(registroHoras)}
                              disabled={updateMutation.isPending}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Guardar"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                      </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(registroHoras)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                      </button>
                            <button
                              onClick={() => handleDelete(registroHoras)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                      </button>
                          </div>
                        )}
                    </td>
                  </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>

        {/* Información y Sugerencias */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            Información sobre Registro de Horas
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
            <li>• Registre las horas trabajadas por cada persona</li>
            <li>• Puede asociar las horas a una campaña específica</li>
            <li>• Edite los registros directamente en la tabla</li>
            <li>• Los registros se utilizan para calcular costos y estadísticas</li>
            <li>• Mantenga un control preciso del tiempo trabajado</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
