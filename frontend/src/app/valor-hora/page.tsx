'use client'

import { useState, useMemo, useEffect } from 'react';
import { useValorHora, useCreateValorHora, useUpdateValorHora, useDeleteValorHora, useValorHoraStats } from '@/hooks/useValorHora';
import { usePersonas } from '@/hooks/usePersonas';
import MainLayout from '@/components/layout/MainLayout';
import {
  Plus,
  Download,
  RotateCcw,
  Search,
  Calculator,
  Trash2,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { ValorHora, CreateValorHoraDto } from '@/types';
import { toast } from 'react-hot-toast';

interface FormData {
  personaId: number;
  valor: number;
  fechaInicio: string;
  notas: string;
}

interface CalculatorData {
  horas: number;
  valor: number;
}

export default function ValorHoraPage() {
  const [formData, setFormData] = useState<FormData>({
    personaId: 0,
    valor: 0,
    fechaInicio: new Date().toISOString().split('T')[0],
    notas: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<ValorHora>>({});
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    horas: 0,
    valor: 0
  });

  // React Query hooks
  const { data: valoresHora = [], isLoading, error, refetch } = useValorHora();
  const { data: personas = [] } = usePersonas(true);
  const { data: stats } = useValorHoraStats();
  const createMutation = useCreateValorHora();
  const updateMutation = useUpdateValorHora();
  const deleteMutation = useDeleteValorHora();

  // Debug logs
  useEffect(() => {
    console.log('ValorHoraPage - Debug Info:', {
      valoresHora,
      personas,
      stats,
      isLoading,
      error,
      valoresHoraLength: valoresHora.length,
      personasLength: personas?.length || 0
    });
  }, [valoresHora, personas, stats, isLoading, error]);

  // Filtrar valores por hora por búsqueda
  const filteredValoresHora = useMemo(() => {
    if (!searchTerm) return valoresHora;
    return (valoresHora || []).filter(valorHora => {
      const persona = (personas || []).find(p => p.id === valorHora.personaId);
      const nombrePersona = persona?.nombre || '';
      return nombrePersona.toLowerCase().includes(searchTerm.toLowerCase()) ||
             valorHora.valor.toString().includes(searchTerm);
    });
  }, [valoresHora, personas, searchTerm]);

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Obtener nombre de la persona
  const getPersonaName = (personaId: number) => {
    const persona = (personas || []).find(p => p.id === personaId);
    return persona?.nombre || 'Persona no encontrada';
  };

  // Calcular resultado de la calculadora
  const calculatorResult = useMemo(() => {
    return calculatorData.horas * calculatorData.valor;
  }, [calculatorData]);

  // Agregar nuevo valor hora
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.personaId || !formData.valor || !formData.fechaInicio) {
      toast.error('Debe completar todos los campos obligatorios');
      return;
    }

    // Verificar si ya existe un valor para esta persona en la misma fecha
    const existingValue = (valoresHora || []).find(vh =>
      vh.personaId === formData.personaId && vh.fechaInicio === formData.fechaInicio
    );

    if (existingValue) {
      toast.error('Ya existe un valor para esta persona en la fecha especificada');
      return;
    }

    try {
      const createData: CreateValorHoraDto = {
        personaId: formData.personaId,
        valor: formData.valor,
        fechaInicio: formData.fechaInicio,
        notas: formData.notas
      };

      await createMutation.mutateAsync(createData);

      // Limpiar formulario
      setFormData({
        personaId: 0,
        valor: 0,
        fechaInicio: new Date().toISOString().split('T')[0],
        notas: ''
      });
    } catch (error) {
      console.error('Error al crear valor por hora:', error);
    }
  };

  // Iniciar edición
  const handleEdit = (valorHora: ValorHora) => {
    setEditingId(valorHora.id);
    setEditingData({
      valor: valorHora.valor,
      fechaInicio: valorHora.fechaInicio,
      notas: valorHora.notas
    });
  };

  // Guardar edición
  const handleSaveEdit = async (valorHora: ValorHora) => {
    try {
      await updateMutation.mutateAsync({
        id: valorHora.id,
        data: editingData
      });
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      console.error('Error al actualizar valor por hora:', error);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // Eliminar valor hora
  const handleDelete = async (valorHora: ValorHora) => {
    const confirmed = confirm(`¿Estás seguro de eliminar el valor por hora de "${getPersonaName(valorHora.personaId)}"?`);
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(valorHora.id);
    } catch (error) {
      console.error('Error al eliminar valor por hora:', error);
    }
  };

  // Exportar a CSV
  const exportarValorHora = () => {
    const datosExportar = (valoresHora || []).map(vh => ({
      ID: vh.id,
      Persona: getPersonaName(vh.personaId),
      'Valor por Hora': formatCurrency(vh.valor),
      'Fecha Inicio': vh.fechaInicio,
      Notas: vh.notas || ''
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
    link.setAttribute('download', 'valores-por-hora.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recalcular todo
  const recalcularTodo = async () => {
    try {
      await refetch();
      toast.success('Sistema recalculado');
    } catch (error) {
      console.error('Error al recalcular:', error);
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6 p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800">Error cargando valores por hora</h3>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Valor por Hora</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra las tarifas por hora de trabajo de cada persona
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={exportarValorHora}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
            <button
              onClick={recalcularTodo}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Recalculando...' : 'Recalcular'}
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-blue-100 text-sm font-medium">Valor Promedio</p>
                <p className="text-2xl font-bold">
                  {stats ? formatCurrency(stats.valorPromedio) : 'Cargando...'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-green-100 text-sm font-medium">Personas con Valor</p>
                <p className="text-2xl font-bold">
                  {stats ? stats.personasConValor : 'Cargando...'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-purple-100 text-sm font-medium">Valor Máximo</p>
                <p className="text-2xl font-bold">
                  {stats ? formatCurrency(stats.valorMaximo) : 'Cargando...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculadora Rápida */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            <Calculator className="inline h-5 w-5 mr-2" />
            Calculadora Rápida
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Horas
              </label>
              <input
                type="number"
                value={calculatorData.horas}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, horas: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor por Hora
              </label>
              <input
                type="number"
                value={calculatorData.valor}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>
      <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total
              </label>
              <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-semibold">
                {formatCurrency(calculatorResult)}
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Agregar Valor Hora */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            <Plus className="inline h-5 w-5 mr-2" />
            Agregar Nuevo Valor por Hora
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  Valor por Hora *
                </label>
                <input
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="0"
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas
                </label>
                <input
                  type="text"
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
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
                {createMutation.isPending ? 'Agregando...' : 'Agregar Valor por Hora'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de Valores por Hora */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Valores por Hora Registrados
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por persona o valor..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Persona
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor por Hora
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha Inicio
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
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Cargando valores por hora...
                    </td>
                  </tr>
                ) : filteredValoresHora.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron valores por hora
                    </td>
                  </tr>
                ) : (
                  filteredValoresHora.map((valorHora) => (
                    <tr key={valorHora.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {valorHora.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {getPersonaName(valorHora.personaId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {editingId === valorHora.id ? (
                          <input
                            type="number"
                            value={editingData.valor || valorHora.valor}
                            onChange={(e) => setEditingData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            min="0"
                            step="1000"
                          />
                        ) : (
                          formatCurrency(valorHora.valor)
                        )}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {editingId === valorHora.id ? (
                          <input
                            type="date"
                            value={editingData.fechaInicio || valorHora.fechaInicio}
                            onChange={(e) => setEditingData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          new Date(valorHora.fechaInicio).toLocaleDateString('es-CO')
                        )}
                    </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {editingId === valorHora.id ? (
                          <input
                            type="text"
                            value={editingData.notas || valorHora.notas || ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, notas: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Notas"
                          />
                        ) : (
                          valorHora.notas || '-'
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === valorHora.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveEdit(valorHora)}
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
                              onClick={() => handleEdit(valorHora)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                      </button>
                            <button
                              onClick={() => handleDelete(valorHora)}
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
            Información sobre Valores por Hora
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
            <li>• Los valores por hora se utilizan para calcular los costos de trabajo</li>
            <li>• Puede tener múltiples valores por persona en diferentes fechas</li>
            <li>• El sistema automáticamente usa el valor más reciente para cada persona</li>
            <li>• Use la calculadora rápida para estimar costos de proyectos</li>
            <li>• Exporte los datos para análisis externos</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
