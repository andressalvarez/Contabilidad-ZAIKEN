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
import { toast } from 'sonner';
import { ScrollableTable } from '@/components/ui/ScrollableTable';

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
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <DollarSign className="text-indigo-600" size={24} />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Valor por Hora</h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 ml-10 sm:ml-12">Administra las tarifas por hora de trabajo</p>
            </div>

            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={exportarValorHora}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shadow-sm text-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">Exportar</span>
              </button>
              <button
                onClick={recalcularTodo}
                disabled={isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isLoading ? 'Recalculando...' : 'Recalcular'}</span>
                <span className="sm:hidden">{isLoading ? '...' : 'Recalc.'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg">
                <DollarSign className="text-indigo-600" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Valor Promedio</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {stats ? formatCurrency(stats.valorPromedio) : '...'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Con Valor</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {stats ? stats.usuariosConValor : '...'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Valor Máximo</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {stats ? formatCurrency(stats.valorMaximo) : '...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculadora Rápida */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calculator className="text-amber-600" size={18} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Calculadora Rápida</h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Horas
              </label>
              <input
                type="number"
                value={calculatorData.horas}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, horas: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                $/Hora
              </label>
              <input
                type="number"
                value={calculatorData.valor}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Total Calculado
              </label>
              <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-bold text-base sm:text-lg min-h-[44px] flex items-center">
                {formatCurrency(calculatorResult)}
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Agregar Valor Hora */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="text-green-600" size={18} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Agregar Nuevo Valor por Hora</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Usuario *
                </label>
                <select
                  value={formData.usuarioId}                  onChange={(e) => setFormData(prev => ({ ...prev, usuarioId: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
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
                <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Valor/Hora *
                </label>
                <input
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                  placeholder="0"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Fecha Inicio *
                </label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Notas
                </label>
                <input
                  type="text"
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                  placeholder="Notas adicionales"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Plus className="h-4 w-4" />
                {createMutation.isPending ? 'Agregando...' : 'Agregar Valor'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de Valores por Hora */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="text-blue-600" size={18} />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Valores Registrados ({filteredValoresHora.length})
                </h2>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-10 w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <ScrollableTable>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor/Hora
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Fecha
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Notas
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Cargando valores...</p>
                    </td>
                  </tr>
                ) : filteredValoresHora.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                      <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay valores</h3>
                      <p className="text-sm text-gray-600">Agrega el primer valor por hora</p>
                    </td>
                  </tr>
                ) : (
                  filteredValoresHora.map((valorHora) => (
                    <tr key={valorHora.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm text-gray-900">#{valorHora.id}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1 sm:p-1.5 bg-indigo-100 rounded">
                            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-600" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{getUserName(valorHora)}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {editingId === valorHora.id ? (
                          <input
                            type="number"
                            value={editingData.valor || valorHora.valor}
                            onChange={(e) => setEditingData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                            className="w-24 sm:w-32 px-2 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white min-h-[32px]"
                            min="0"
                            step="1000"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(valorHora.valor)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                        {editingId === valorHora.id ? (
                          <input
                            type="date"
                            value={editingData.fechaInicio || valorHora.fechaInicio}
                            onChange={(e) => setEditingData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white min-h-[32px]"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                            {new Date(valorHora.fechaInicio).toLocaleDateString('es-CO')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 max-w-[100px] sm:max-w-xs truncate hidden md:table-cell">
                        {editingId === valorHora.id ? (
                          <input
                            type="text"
                            value={editingData.notas || valorHora.notas || ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, notas: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white min-h-[32px]"
                            placeholder="Notas"
                          />
                        ) : (
                          valorHora.notas || '-'
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === valorHora.id ? (
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => handleSaveEdit(valorHora)}
                              disabled={updateMutation.isPending}
                              className="text-green-600 hover:text-green-900 p-1.5 sm:p-1 hover:bg-green-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Guardar"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 p-1.5 sm:p-1 hover:bg-gray-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEdit(valorHora)}
                              className="text-indigo-600 hover:text-indigo-900 p-1.5 sm:p-1 hover:bg-indigo-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(valorHora)}
                              className="text-red-600 hover:text-red-900 p-1.5 sm:p-1 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
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
          </ScrollableTable>
        </div>

        {/* Información y Sugerencias */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="text-blue-600" size={18} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Información</h3>
          </div>
          <ul className="text-gray-600 text-xs sm:text-sm space-y-1.5 sm:space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Los valores se usan para calcular costos de trabajo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Múltiples valores por persona en diferentes fechas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>El sistema usa el valor más reciente automáticamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>Use la calculadora para estimar costos de proyectos</span>
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
