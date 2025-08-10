'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTransacciones, useCreateTransaccion, useUpdateTransaccion, useDeleteTransaccion, useTendenciasMensuales, useResumenPorCategorias, useResumenPorTiposGasto, useTransaccionesStats } from '@/hooks/useTransacciones';
import { useCategorias } from '@/hooks/useCategorias';
import { useTiposTransaccion } from '@/hooks/useTiposTransaccion';
import { usePersonas } from '@/hooks/usePersonas';
import { useRoles } from '@/hooks/useRoles';
import { useCampanas } from '@/hooks/useCampanas';
import { Transaccion } from '@/types';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Filter,
  Download,
  Save,
  X,
  Trash2,
  Edit3,
  TrendingUp,
  BarChart3,
  Building2,
  Calendar,
  DollarSign,
  Users,
  Target,
  FileText
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

export default function TransaccionesPage() {
  // Estados principales
  const [showCharts, setShowCharts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingData, setEditingData] = useState<Partial<Transaccion>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaccion, setSelectedTransaccion] = useState<Transaccion | null>(null);

  // Cambia el estado inicial y el formulario para usar categoriaId
  const [filters, setFilters] = useState({
    tipo: '',
    categoriaId: '',
    personaId: '',
    campanaId: '',
    fechaInicio: '',
    fechaFin: ''
  });

  // Filtros para gráficas
  const [chartFilters, setChartFilters] = useState({
    personaId: '',
    fechaInicio: '',
    fechaFin: ''
  });

  // Año actual para las tendencias
  const añoActual = new Date().getFullYear();

  // Hooks de datos
  const { data: transacciones = [], isLoading, refetch } = useTransacciones(filters);
  const { data: stats } = useTransaccionesStats(filters);
  const { data: categorias = [], isLoading: categoriasLoading, error: categoriasError } = useCategorias();
  const { data: tiposTransaccion = [], isLoading: tiposTransaccionLoading } = useTiposTransaccion();
  const { data: personas = [] } = usePersonas();
  const { data: roles = [] } = useRoles();
  const { data: campanas = [] } = useCampanas();
  const { data: tendenciasMensuales = [], isLoading: loadingTendencias, refetch: refetchTendencias } = useTendenciasMensuales(añoActual, chartFilters);
  const { data: resumenTiposGasto = [], isLoading: loadingResumen, refetch: refetchResumen } = useResumenPorTiposGasto(chartFilters);

  // Formulario para nueva transacción
  // Cambia el estado inicial y el formulario para usar categoriaId
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipoId: 0,
    concepto: '',
    categoriaId: '',
    monto: '',
    moneda: 'COP',
    personaId: '',
    campanaId: '',
    notas: ''
  });

  // Establecer tipoId por defecto cuando se carguen los tipos
  useEffect(() => {
    if (tiposTransaccion.length > 0 && formData.tipoId === 0) {
      const tipoIngreso = tiposTransaccion.find(t => t.nombre === 'INGRESO');
      if (tipoIngreso) {
        setFormData(prev => ({ ...prev, tipoId: tipoIngreso.id }));
      }
    }
  }, [tiposTransaccion, formData.tipoId]);

  // Mutaciones
  const createTransaccion = useCreateTransaccion();
  const updateTransaccion = useUpdateTransaccion();
  const deleteTransaccion = useDeleteTransaccion();

  // Función para agregar transacción
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fecha || !formData.concepto || !formData.monto || parseFloat(formData.monto) <= 0) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }
    if (!formData.tipoId || !tiposTransaccion.find(t => t.id === formData.tipoId)) {
      toast.error('Tipo de transacción inválido');
      return;
    }
    if (formData.tipoId === 3 && !formData.personaId) {
      toast.error('Para aportes debe seleccionar una persona');
      return;
    }
    try {
      await createTransaccion.mutateAsync({
        fecha: formData.fecha,
        tipoId: formData.tipoId,
        concepto: formData.concepto,
        categoriaId: formData.categoriaId ? Number(formData.categoriaId) : undefined,
        monto: parseFloat(formData.monto),
        moneda: formData.moneda || 'COP',
        personaId: formData.personaId ? Number(formData.personaId) : undefined,
        campanaId: formData.campanaId ? Number(formData.campanaId) : undefined,
        notas: formData.notas || ''
      });
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        tipoId: 0, // Resetear a INGRESO por defecto
        concepto: '',
        categoriaId: '',
        monto: '',
        moneda: 'COP',
        personaId: '',
        campanaId: '',
        notas: ''
      });
      toast.success('Transacción agregada exitosamente');
      refetch();
      refetchTendencias();
      refetchResumen();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Error al agregar la transacción');
    }
  };

  // Función para eliminar transacción
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      return;
    }
    try {
      await deleteTransaccion.mutateAsync(id);
      toast.success('Transacción eliminada exitosamente');
      refetch();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Error al eliminar la transacción');
    }
  };

  // 🎨 FUNCIONES DE MODAL DE EDICIÓN
  const handleOpenEditModal = (transaccion: Transaccion) => {
    console.log('🎨 DEBUG: Abriendo modal para transacción:', transaccion.id);
    setSelectedTransaccion(transaccion);
    setEditingData({
      fecha: transaccion.fecha?.split('T')[0] || '',
      tipoId: transaccion.tipoId,
      concepto: transaccion.concepto,
      categoriaId: transaccion.categoriaId,
      monto: transaccion.monto,
      moneda: transaccion.moneda || 'COP',
      personaId: transaccion.personaId,
      campanaId: transaccion.campanaId,
      notas: transaccion.notas || ''
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    console.log('🎨 DEBUG: Cerrando modal');
    setShowEditModal(false);
    setSelectedTransaccion(null);
    setEditingData({});
  };

  const handleSaveEditModal = async () => {
    console.log('🎨 DEBUG: Guardando desde modal para ID:', selectedTransaccion?.id);
    console.log('🎨 DEBUG: Datos a guardar:', editingData);

    if (!selectedTransaccion) {
      toast.error('Error: No hay transacción seleccionada');
      return;
    }

    // Validaciones
    if (!editingData.fecha || !editingData.concepto || !editingData.monto) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (typeof editingData.monto === 'string' && parseFloat(editingData.monto) <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    try {
      const updateData = {
        fecha: editingData.fecha,
        tipoId: editingData.tipoId,
        concepto: editingData.concepto,
        categoriaId: editingData.categoriaId || undefined,
        monto: typeof editingData.monto === 'string' ? parseFloat(editingData.monto) : editingData.monto,
        moneda: editingData.moneda || 'COP',
        personaId: editingData.personaId || undefined,
        campanaId: editingData.campanaId || undefined,
        notas: editingData.notas || ''
      };

      await updateTransaccion.mutateAsync({
        id: selectedTransaccion.id,
        ...updateData
      });

      toast.success('¡Transacción actualizada exitosamente! 🎉');

      // Cerrar modal y limpiar
      handleCloseEditModal();

      // Refrescar datos
      refetch();
      refetchTendencias();
      refetchResumen();

    } catch (error) {
      console.error('🎨 DEBUG: Error al actualizar:', error);
      toast.error('Error al actualizar la transacción');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para exportar a CSV
  const handleExport = () => {
    const headers = [
      'ID', 'Fecha', 'Tipo', 'Concepto', 'Categoría', 'Monto', 'Moneda',
      'Persona', 'Tipo de Gasto', 'Notas'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredTransacciones.map(t => [
        t.id,
        new Date(t.fecha).toLocaleDateString('es-CO'),
        t.tipo,
        `"${t.concepto || ''}"`,
        t.categoria?.nombre || '',
        t.monto,
        t.moneda,
        t.persona?.nombre || '',
        t.campana?.nombre || '',
        `"${t.notas || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Archivo CSV exportado exitosamente');
  };

  // Referencias para gráficos
  const chartMensualRef = useRef<HTMLCanvasElement>(null);
  const chartGastosCatRef = useRef<HTMLCanvasElement>(null);
  const chartMensualInstance = useRef<any>(null);
  const chartGastosCatInstance = useRef<any>(null);

  // Datos filtrados
  const filteredTransacciones = useMemo(() => {
    return transacciones.filter(transaccion => {
      const matchesSearch = searchTerm === '' ||
        transaccion.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaccion.categoria?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaccion.persona?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaccion.campana?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = !filters.tipo || transaccion.tipo?.nombre === filters.tipo;
      const matchesCategoria = !filters.categoriaId || transaccion.categoriaId === parseInt(filters.categoriaId);
      const matchesPersona = !filters.personaId || transaccion.personaId === parseInt(filters.personaId);
      const matchesCampana = !filters.campanaId || transaccion.campanaId === parseInt(filters.campanaId);

      return matchesSearch && matchesTipo && matchesCategoria && matchesPersona && matchesCampana;
    });
  }, [transacciones, searchTerm, filters]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const ingresos = filteredTransacciones
      .filter(t => t.tipo?.nombre === 'INGRESO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);

    const gastos = filteredTransacciones
      .filter(t => t.tipo?.nombre === 'GASTO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);

    const aportes = filteredTransacciones
      .filter(t => t.tipo?.nombre === 'APORTE')
      .reduce((acc, t) => acc + (t.monto || 0), 0);

    return {
      ingresos,
      gastos,
      aportes,
      balance: ingresos - gastos
    };
  }, [filteredTransacciones]);

  // Configurar gráficos usando la metodología que funciona
  useEffect(() => {
    if (!showCharts || typeof window === 'undefined' || !window.Chart) return;

    // Destruir gráficos existentes
    if (chartMensualRef.current) {
      const existingChart = window.Chart.getChart(chartMensualRef.current);
      if (existingChart) {
        existingChart.destroy();
      }
    }

    if (chartGastosCatRef.current) {
      const existingChart = window.Chart.getChart(chartGastosCatRef.current);
      if (existingChart) {
        existingChart.destroy();
      }
    }

    // Gráfico mensual (línea)
    if (chartMensualRef.current) {
      const ctx = chartMensualRef.current.getContext('2d');
      if (!ctx) {
        return;
      }

      const meses = tendenciasMensuales.map(t => t.nombre);
      const dataIng = tendenciasMensuales.map(t => t.ingresos);
      const dataGast = tendenciasMensuales.map(t => t.gastos);
      const dataAport = tendenciasMensuales.map(t => t.aportes || 0);

      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: meses,
          datasets: [
            {
              label: 'Ingresos',
              data: dataIng,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16,185,129,0.2)',
              tension: 0.3
            },
            {
              label: 'Gastos',
              data: dataGast,
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239,68,68,0.2)',
              tension: 0.3
            },
            {
              label: 'Aportes',
              data: dataAport,
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59,130,246,0.2)',
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            title: {
              display: true,
              text: 'Ingresos y Gastos Mensuales'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return 'COP ' + Number(value).toLocaleString('es-CO')
                }
              }
            }
          }
        }
      });
    }

    // Gráfico de gastos por tipo de gasto (barras)
    if (chartGastosCatRef.current) {
      const ctx = chartGastosCatRef.current.getContext('2d');
      if (!ctx) {
        return;
      }

      const topTiposGasto = resumenTiposGasto
        .filter(item => item.totalGastos > 0)
        .sort((a, b) => b.totalGastos - a.totalGastos)
        .slice(0, 10);
      const labelsTiposGasto = topTiposGasto.map(item => item.tipoGasto);
      const dataTiposGasto = topTiposGasto.map(item => item.totalGastos);

      new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: labelsTiposGasto.length ? labelsTiposGasto : ['Sin datos'],
          datasets: [
            {
              label: 'Gasto (COP)',
              data: labelsTiposGasto.length ? dataTiposGasto : [0],
              backgroundColor: generateColors(labelsTiposGasto.length || 1)
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Top 10 Tipos de Gasto'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return 'COP ' + Number(value).toLocaleString('es-CO')
                }
              }
            }
          }
        }
      });
    }
  }, [showCharts, tendenciasMensuales, resumenTiposGasto]);

  // Función para generar colores
  const generateColors = (count: number) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors.slice(0, count);
  };

  // Efecto para actualizar gráficos cuando cambien los filtros
  useEffect(() => {
    refetchTendencias();
    refetchResumen();
  }, [chartFilters, refetchTendencias, refetchResumen]);

  // Función para recargar gráficos
  const recargarGraficos = () => {
    refetchTendencias();
    refetchResumen();
  };

  // Mejora el manejo de errores de la API
  const handleApiError = (error) => {
    if (!error) return toast.error('Error desconocido de la API');
    if (error.message) return toast.error(error.message);
    if (error.response?.data?.message) return toast.error(error.response.data.message);
    toast.error('Error desconocido de la API');
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Transacciones</h1>
          </div>
        </div>

        {/* Estadísticas en cascada */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-green-600 font-medium">Total Ingresos</p>
            <p className="text-2xl font-bold text-green-800">
              COP {estadisticas.ingresos.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-red-600 font-medium">Total Gastos</p>
            <p className="text-2xl font-bold text-red-800">
              COP {estadisticas.gastos.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-600 font-medium">Total Aportes</p>
            <p className="text-2xl font-bold text-blue-800">
              COP {estadisticas.aportes.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-purple-600 font-medium">Balance</p>
            <p className={`text-2xl font-bold ${estadisticas.balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              COP {estadisticas.balance.toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        {/* Formulario de nueva transacción */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva Transacción
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.tipoId}
                  onChange={(e) => setFormData({...formData, tipoId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {tiposTransaccion.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto *
                </label>
                <input
                  type="text"
                  value={formData.concepto}
                  onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                  placeholder="Descripción de la transacción"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.categoriaId || ""}
                  onChange={e => setFormData({...formData, categoriaId: e.target.value ? Number(e.target.value) : undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccione categoría --</option>
                  {categoriasLoading ? (
                    <option value="" disabled>Cargando categorías...</option>
                  ) : categoriasError ? (
                    <option value="" disabled>Error cargando categorías</option>
                  ) : Array.isArray(categorias) && categorias.length > 0 ? (
                    categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))
                  ) : (
                    <option value="" disabled>No hay categorías disponibles</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto (COP) *
                </label>
                <input
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: e.target.value})}
                  placeholder="0"
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Moneda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda
                </label>
                <select
                  value={formData.moneda}
                  onChange={(e) => setFormData({...formData, moneda: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              {/* Persona */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona
                </label>
                <select
                  value={formData.personaId}
                  onChange={(e) => setFormData({...formData, personaId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccione persona --</option>
                  {personas.map(persona => (
                    <option key={persona.id} value={persona.id}>{persona.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Campaña/Tipo de Gasto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Gasto
                </label>
                <select
                  value={formData.campanaId}
                  onChange={(e) => setFormData({...formData, campanaId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccione tipo de gasto --</option>
                  {campanas.map(campana => (
                    <option key={campana.id} value={campana.id}>{campana.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                placeholder="Notas adicionales"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Botón de agregar */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <Plus size={20} className="inline mr-2" />
                Agregar Transacción
              </button>
            </div>
          </form>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fechas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={filters.fechaInicio}
                  onChange={(e) => setFilters({...filters, fechaInicio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={filters.fechaFin}
                  onChange={(e) => setFilters({...filters, fechaFin: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filters.tipo}
                  onChange={(e) => setFilters({...filters, tipo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  {tiposTransaccion.map(tipo => (
                    <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={filters.categoriaId || ""}
                  onChange={e => setFilters({...filters, categoriaId: e.target.value ? Number(e.target.value) : undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={categoriasLoading}
                >
                  <option value="">Todas las categorías</option>
                  {categoriasLoading ? (
                    <option value="" disabled>Cargando categorías...</option>
                  ) : categoriasError ? (
                    <option value="" disabled>Error cargando categorías</option>
                  ) : Array.isArray(categorias) && categorias.length > 0 ? (
                    categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))
                  ) : (
                    <option value="" disabled>No hay categorías disponibles</option>
                  )}
                </select>
                {categoriasError && (
                  <p className="text-xs text-red-500 mt-1">Error: {categoriasError.message}</p>
                )}
              </div>

              {/* Persona */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona
                </label>
                <select
                  value={filters.personaId}
                  onChange={(e) => setFilters({...filters, personaId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las personas</option>
                  {personas.map(persona => (
                    <option key={persona.id} value={persona.id}>{persona.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Campaña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Gasto
                </label>
                <select
                  value={filters.campanaId}
                  onChange={(e) => setFilters({...filters, campanaId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos de gasto</option>
                  {campanas.map(campana => (
                    <option key={campana.id} value={campana.id}>{campana.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <button
                onClick={() => {/* Lógica de filtrar */}}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Filtrar
              </button>
              <button
                onClick={() => setFilters({
                  tipo: '',
                  categoriaId: '',
                  personaId: '',
                  campanaId: '',
                  fechaInicio: '',
                  fechaFin: ''
                })}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Limpiar
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Download size={16} className="inline mr-2" />
                Exportar CSV
              </button>
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <BarChart3 size={16} className="inline mr-2" />
                Actualizar Stats
              </button>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico mensual */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Ingresos y Gastos Mensuales</h3>
                <div className="flex gap-2">
                  <select
                    value={chartFilters.personaId}
                    onChange={(e) => setChartFilters({...chartFilters, personaId: e.target.value})}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Filtrar persona: Todas</option>
                    {personas.map(persona => (
                      <option key={persona.id} value={persona.id}>{persona.nombre}</option>
                    ))}
                  </select>
                  <button
                    onClick={recargarGraficos}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Recargar
                  </button>
                </div>
              </div>
              <div className="h-64">
                {loadingTendencias ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando gráfico...</span>
                  </div>
                ) : tendenciasMensuales.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos para mostrar</h3>
                      <p className="text-gray-500">Crea transacciones para ver la tendencia mensual</p>
                    </div>
                  </div>
                ) : (
                  <canvas ref={chartMensualRef}></canvas>
                )}
              </div>
            </div>

            {/* Gráfico de gastos por tipo de gasto */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Top 10 Tipos de Gasto</h3>
                <button
                  onClick={recargarGraficos}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Recargar
                </button>
              </div>
              <div className="h-64">
                {loadingResumen ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando gráfico...</span>
                  </div>
                ) : resumenTiposGasto.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos para mostrar</h3>
                      <p className="text-gray-500">Crea transacciones de gasto para ver el resumen por tipos</p>
                    </div>
                  </div>
                ) : (
                  <canvas ref={chartGastosCatRef}></canvas>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabla de transacciones */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transacciones ({filteredTransacciones.length})
            </h2>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando transacciones...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mon.
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Persona
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo de Gasto
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notas
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransacciones.map((transaccion) => (
                      <tr key={transaccion.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaccion.id}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaccion.fecha).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaccion.tipo?.nombre === 'INGRESO'
                              ? 'bg-green-100 text-green-800'
                              : transaccion.tipo?.nombre === 'GASTO'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {transaccion.tipo?.nombre || 'Sin tipo'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {transaccion.concepto || <span className="text-gray-400 italic">Sin concepto</span>}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {transaccion.categoria?.nombre || <span className="text-gray-400 italic">Sin categoría</span>}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {transaccion.moneda === 'USD' ? '$ ' : 'COP '}
                          {transaccion.monto?.toLocaleString('es-CO')}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                            transaccion.moneda === 'COP'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaccion.moneda}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {transaccion.persona ? (
                            <span className="text-blue-600 font-medium">{transaccion.persona.nombre}</span>
                          ) : (
                            <span className="text-gray-400 italic">Sin persona</span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {transaccion.campana ? (
                            <span className="text-purple-600 font-medium">{transaccion.campana.nombre}</span>
                          ) : (
                            <span className="text-gray-400 italic">Sin tipo</span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {transaccion.notas || <span className="text-gray-400 italic">Sin notas</span>}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleOpenEditModal(transaccion)}
                              className="text-orange-600 hover:text-orange-900 transition-colors"
                              title="Editar transacción"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(transaccion.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredTransacciones.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay transacciones para mostrar
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🎨 MODAL DE EDICIÓN BONITO */}
      {showEditModal && selectedTransaccion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  ✏️ Editar Transacción
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  ID: {selectedTransaccion.id} • Editando datos de la transacción
                </p>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Row 1: Fecha y Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Fecha *
                  </label>
                  <input
                    type="date"
                    value={editingData.fecha || ''}
                    onChange={(e) => handleFieldChange('fecha', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ Tipo *
                  </label>
                  <select
                    value={editingData.tipoId || ''}
                    onChange={(e) => handleFieldChange('tipoId', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposTransaccion.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre === 'INGRESO' ? '💰' : tipo.nombre === 'GASTO' ? '💸' : '🤝'} {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Concepto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Concepto *
                </label>
                <input
                  type="text"
                  value={editingData.concepto || ''}
                  onChange={(e) => handleFieldChange('concepto', e.target.value)}
                  placeholder="Descripción de la transacción"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              {/* Row 3: Monto y Moneda */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💵 Monto *
                  </label>
                  <input
                    type="number"
                    value={editingData.monto || ''}
                    onChange={(e) => handleFieldChange('monto', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💱 Moneda
                  </label>
                  <select
                    value={editingData.moneda || 'COP'}
                    onChange={(e) => handleFieldChange('moneda', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="COP">🇨🇴 COP</option>
                    <option value="USD">🇺🇸 USD</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Categoría y Persona */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🗂️ Categoría
                  </label>
                  <select
                    value={editingData.categoriaId || ''}
                    onChange={(e) => handleFieldChange('categoriaId', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Persona
                  </label>
                  <select
                    value={editingData.personaId || ''}
                    onChange={(e) => handleFieldChange('personaId', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sin persona</option>
                    {personas.map(persona => (
                      <option key={persona.id} value={persona.id}>{persona.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Campaña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 Campaña
                </label>
                <select
                  value={editingData.campanaId || ''}
                  onChange={(e) => handleFieldChange('campanaId', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Sin campaña</option>
                  {campanas.map(campana => (
                    <option key={campana.id} value={campana.id}>{campana.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Row 6: Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 Notas
                </label>
                <textarea
                  value={editingData.notas || ''}
                  onChange={(e) => handleFieldChange('notas', e.target.value)}
                  placeholder="Notas adicionales (opcional)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <button
                onClick={handleCloseEditModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={handleSaveEditModal}
                disabled={updateTransaccion.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {updateTransaccion.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    ✅ Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

