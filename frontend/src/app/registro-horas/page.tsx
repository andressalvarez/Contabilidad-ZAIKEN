'use client'

import { useState, useMemo, useEffect } from 'react';
import { useRegistroHoras, useCreateRegistroHoras, useUpdateRegistroHoras, useDeleteRegistroHoras } from '@/hooks/useRegistroHoras';
import { usePersonas } from '@/hooks/usePersonas';
import MainLayout from '@/components/layout/MainLayout';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Clock,
  User,
  Calendar,
  FileText,
  Search,
  AlertCircle,
  BarChart3,
  Timer,
  CheckCircle,
  Info
} from 'lucide-react';
import { RegistroHoras, CreateRegistroHorasDto } from '@/types';
import { toast } from 'react-hot-toast';

interface FormData {
  fecha: string;
  personaId: number;
  horas: number;
  descripcion: string;
}

export default function RegistroHorasPage() {
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date().toISOString().split('T')[0],
    personaId: 0,
    horas: 0,
    descripcion: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<RegistroHoras>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // React Query hooks
  const { data: registrosHoras = [], isLoading, error, refetch } = useRegistroHoras();
  const { data: personas = [] } = usePersonas(true);
  const createMutation = useCreateRegistroHoras();
  const updateMutation = useUpdateRegistroHoras();
  const deleteMutation = useDeleteRegistroHoras();

  // Debug logs
  useEffect(() => {
    console.log('RegistroHorasPage - Debug Info:', {
      registrosHoras,
      personas,
      isLoading,
      error,
      registrosHorasLength: registrosHoras.length,
      personasLength: personas?.length || 0
    });
  }, [registrosHoras, personas, isLoading, error]);

  // Filtrar registros por búsqueda
  const filteredRegistros = useMemo(() => {
    if (!searchTerm) return registrosHoras;
    return (registrosHoras || []).filter(registro => {
      const persona = (personas || []).find(p => p.id === registro.personaId);
      const nombrePersona = persona?.nombre || '';
      return nombrePersona.toLowerCase().includes(searchTerm.toLowerCase()) ||
             registro.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             registro.horas.toString().includes(searchTerm);
    });
  }, [registrosHoras, personas, searchTerm]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalHoras = registrosHoras.reduce((acc, r) => acc + (r.horas || 0), 0);
    const totalRegistros = registrosHoras.length;
    const personasUnicas = new Set(registrosHoras.map(r => r.personaId)).size;

    return {
      totalHoras,
      totalRegistros,
      personasUnicas
    };
  }, [registrosHoras]);

  // Obtener nombre de la persona
  const getPersonaName = (personaId: number) => {
    const persona = (personas || []).find(p => p.id === personaId);
    return persona?.nombre || 'Persona no encontrada';
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
        fecha: formData.fecha,
        horas: formData.horas,
        descripcion: formData.descripcion
      };

      await createMutation.mutateAsync(createData);

      // Limpiar formulario
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        personaId: 0,
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
        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error cargando registros de horas</h3>
              <p className="text-red-600 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Clock className="text-indigo-600" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Registro de Horas</h1>
          </div>
          <p className="text-gray-600 ml-12">Control de tiempo trabajado por persona</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Timer className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Horas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHoras.toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Registros</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRegistros}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Personas Activas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.personasUnicas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Agregar Registro */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Agregar Nuevo Registro de Horas</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4" />
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4" />
                  Persona *
                </label>
                <select
                  value={formData.personaId}
                  onChange={(e) => setFormData(prev => ({ ...prev, personaId: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4" />
                  Horas *
                </label>
                <input
                  type="number"
                  value={formData.horas}
                  onChange={(e) => setFormData(prev => ({ ...prev, horas: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="0"
                  min="0"
                  step="0.5"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="Notas adicionales"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                {createMutation.isPending ? 'Agregando...' : 'Agregar Registro'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de Registros de Horas */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="text-blue-600" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Registros de Horas ({filteredRegistros.length})
                </h2>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar registros..."
                  className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Persona
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Cargando registros de horas...</p>
                    </td>
                  </tr>
                ) : filteredRegistros.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'No se encontraron registros' : 'No hay registros de horas'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza registrando tus primeras horas'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRegistros.map((registroHoras) => (
                    <tr key={registroHoras.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">#{registroHoras.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingId === registroHoras.id ? (
                          <input
                            type="date"
                            value={editingData.fecha || registroHoras.fecha}
                            onChange={(e) => setEditingData(prev => ({ ...prev, fecha: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(registroHoras.fecha)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === registroHoras.id ? (
                          <select
                            value={editingData.personaId || registroHoras.personaId}
                            onChange={(e) => setEditingData(prev => ({ ...prev, personaId: parseInt(e.target.value) || 0 }))}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          >
                            {(personas || []).map(persona => (
                              <option key={persona.id} value={persona.id}>
                                {persona.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 rounded">
                              <User className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <span className="font-medium text-gray-900">{getPersonaName(registroHoras.personaId)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === registroHoras.id ? (
                          <input
                            type="number"
                            value={editingData.horas || registroHoras.horas}
                            onChange={(e) => setEditingData(prev => ({ ...prev, horas: parseFloat(e.target.value) || 0 }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            min="0"
                            step="0.5"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            <Clock className="h-3 w-3" />
                            {registroHoras.horas}h
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {editingId === registroHoras.id ? (
                          <input
                            type="text"
                            value={editingData.descripcion || registroHoras.descripcion || ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, descripcion: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            placeholder="Notas"
                          />
                        ) : (
                          registroHoras.descripcion || '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === registroHoras.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(registroHoras)}
                              disabled={updateMutation.isPending}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                              title="Guardar"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(registroHoras)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(registroHoras)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Información sobre Registro de Horas</h3>
          </div>
          <ul className="text-gray-600 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Registre las horas trabajadas por cada persona</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Edite los registros directamente en la tabla</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Los registros se utilizan para calcular costos y estadísticas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Mantenga un control preciso del tiempo trabajado</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Use el timer para registrar tiempo automáticamente</span>
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
