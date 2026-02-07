'use client'

import { useState, useMemo } from 'react';
import { useValorHora, useCreateValorHora, useUpdateValorHora, useDeleteValorHora, useValorHoraStats } from '@/hooks/useValorHora';
import { useUsuarios } from '@/hooks/useUsuarios';import MainLayout from '@/components/layout/MainLayout';
import {
  Plus,
  Download,
  RotateCcw,
  Search,
  Calculator,
  Trash2,
  Edit3,
  Save,
  X,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  User,
  Calendar,
  FileText,
  Info
} from 'lucide-react';
import { ValorHora, CreateValorHoraDto } from '@/types';
import { toast } from 'react-hot-toast';

interface FormData {
  usuarioId: number;  valor: number;
  fechaInicio: string;
  notas: string;
}

interface CalculatorData {
  horas: number;
  valor: number;
}

export default function ValorHoraPage() {
  const [formData, setFormData] = useState<FormData>({
    usuarioId: 0,    valor: 0,
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
  const { data: usuarios = [] } = useUsuarios();  const { data: stats } = useValorHoraStats();
  const createMutation = useCreateValorHora();
  const updateMutation = useUpdateValorHora();
  const deleteMutation = useDeleteValorHora();


  // Filter hourly rates by search
  const filteredValoresHora = useMemo(() => {
    if (!searchTerm) return valoresHora;
    return (valoresHora || []).filter(valorHora => {
      const nombreUsuario = valorHora.usuario?.nombre || '';
      return nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
             valorHora.valor.toString().includes(searchTerm);
    });
  }, [valoresHora, searchTerm]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get user name from the usuario relation (new system)
  const getUserName = (valorHora: ValorHora) => {
    // Use the usuario relation that comes from the API
    if (valorHora.usuario?.nombre) {
      return valorHora.usuario.nombre;
    }
    return 'Usuario no encontrado';
  };

  // Calculate calculator result
  const calculatorResult = useMemo(() => {
    return calculatorData.horas * calculatorData.valor;
  }, [calculatorData]);

  // Add new hourly rate
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usuarioId || !formData.valor || !formData.fechaInicio) {      toast.error('Debe completar todos los campos obligatorios');
      return;
    }

    // Check if there's already a value for this user on the same date
    const existingValue = (valoresHora || []).find(vh => {
      return vh.usuarioId === formData.usuarioId && vh.fechaInicio === formData.fechaInicio;
    });

    if (existingValue) {
      toast.error('Ya existe un valor para este usuario en la fecha especificada');
      return;
    }

    try {
      const createData: CreateValorHoraDto = {
        usuarioId: formData.usuarioId,        valor: formData.valor,
        fechaInicio: formData.fechaInicio,
        notas: formData.notas
      };

      await createMutation.mutateAsync(createData);

      // Clear form
      setFormData({
        usuarioId: 0,        valor: 0,
        fechaInicio: new Date().toISOString().split('T')[0],
        notas: ''
      });
    } catch (error) {
      console.error('Error al crear valor por hora:', error);
    }
  };

  // Start editing
  const handleEdit = (valorHora: ValorHora) => {
    setEditingId(valorHora.id);
    setEditingData({
      valor: valorHora.valor,
      fechaInicio: valorHora.fechaInicio,
      notas: valorHora.notas
    });
  };

  // Save edit
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

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // Delete hourly rate
  const handleDelete = async (valorHora: ValorHora) => {
    const confirmed = confirm(`¿Estás seguro de eliminar el valor por hora de "${getUserName(valorHora)}"?`);
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(valorHora.id);
    } catch (error) {
      console.error('Error al eliminar valor por hora:', error);
    }
  };

  // Export to CSV
  const exportarValorHora = () => {
    const datosExportar = (valoresHora || []).map(vh => ({
      ID: vh.id,
      Usuario: getUserName(vh),
      'Valor por Hora': formatCurrency(vh.valor),
      'Fecha Inicio': vh.fechaInicio,
      Notas: vh.notas || ''
    }));

    // Create CSV
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

  // Recalculate all
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
        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error cargando valores por hora</h3>
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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <DollarSign className="text-indigo-600" size={28} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Valor por Hora</h1>
              </div>
              <p className="text-gray-600 ml-12">Administra las tarifas por hora de trabajo de cada persona</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={exportarValorHora}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
              <button
                onClick={recalcularTodo}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Recalculando...' : 'Recalcular'}
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <DollarSign className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? formatCurrency(stats.valorPromedio) : 'Cargando...'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Usuarios con Valor</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? stats.usuariosConValor : 'Cargando...'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Máximo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? formatCurrency(stats.valorMaximo) : 'Cargando...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculadora Rápida */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calculator className="text-amber-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Calculadora Rápida</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4" />
                Horas
              </label>
              <input
                type="number"
                value={calculatorData.horas}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, horas: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4" />
                Valor por Hora
              </label>
              <input
                type="number"
                value={calculatorData.valor}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Calculado
              </label>
              <div className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-bold text-lg">
                {formatCurrency(calculatorResult)}
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Agregar Valor Hora */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Agregar Nuevo Valor por Hora</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4" />
                  Usuario *
                </label>
                <select
                  value={formData.usuarioId}                  onChange={(e) => setFormData(prev => ({ ...prev, usuarioId: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Seleccionar usuario</option>
                  {(usuarios || []).map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Valor por Hora *
                </label>
                <input
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="0"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
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
                {createMutation.isPending ? 'Agregando...' : 'Agregar Valor por Hora'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de Valores por Hora */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="text-blue-600" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Valores por Hora Registrados ({filteredValoresHora.length})
                </h2>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por persona o valor..."
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
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor por Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Inicio
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
                      <p className="text-gray-600 mt-2">Cargando valores por hora...</p>
                    </td>
                  </tr>
                ) : filteredValoresHora.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay valores por hora</h3>
                      <p className="text-gray-600">Comienza agregando el primer valor por hora</p>
                    </td>
                  </tr>
                ) : (
                  filteredValoresHora.map((valorHora) => (
                    <tr key={valorHora.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">#{valorHora.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-100 rounded">
                            <User className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-900">{getUserName(valorHora)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === valorHora.id ? (
                          <input
                            type="number"
                            value={editingData.valor || valorHora.valor}
                            onChange={(e) => setEditingData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                            className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            min="0"
                            step="1000"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(valorHora.valor)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingId === valorHora.id ? (
                          <input
                            type="date"
                            value={editingData.fechaInicio || valorHora.fechaInicio}
                            onChange={(e) => setEditingData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {new Date(valorHora.fechaInicio).toLocaleDateString('es-CO')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {editingId === valorHora.id ? (
                          <input
                            type="text"
                            value={editingData.notas || valorHora.notas || ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, notas: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            placeholder="Notas"
                          />
                        ) : (
                          valorHora.notas || '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === valorHora.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(valorHora)}
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
                              onClick={() => handleEdit(valorHora)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(valorHora)}
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
            <h3 className="text-lg font-semibold text-gray-900">Información sobre Valores por Hora</h3>
          </div>
          <ul className="text-gray-600 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Los valores por hora se utilizan para calcular los costos de trabajo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Puede tener múltiples valores por persona en diferentes fechas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>El sistema automáticamente usa el valor más reciente para cada persona</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Use la calculadora rápida para estimar costos de proyectos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Exporte los datos para análisis externos</span>
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
