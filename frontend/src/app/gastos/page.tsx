'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { DeleteCampaignModal } from '@/components/DeleteCampaignModal';
import { useCampanas, useCreateCampana, useUpdateCampana, useDeleteCampana } from '@/hooks/useCampanas';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Target,
  Calendar,
  Users,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';

// Import Chart.js dynamically
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('chart.js/auto'), {
  ssr: false,
  loading: () => <div>Loading chart...</div>
});

export default function GastosPage() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCharts, setShowCharts] = useState(true);
  const [deletingCampana, setDeletingCampana] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    presupuesto: '',
    objetivoIngresos: '',
    descripcion: ''
  });

  // React Query hooks
  const { data: campanas = [], isLoading, refetch, error } = useCampanas();
  const createCampana = useCreateCampana();
  const updateCampana = useUpdateCampana();
  const deleteCampana = useDeleteCampana();

  // Charts refs
  const chartIngGastRef = useRef<HTMLCanvasElement>(null);
  const chartRentabilidadRef = useRef<HTMLCanvasElement>(null);
  const chartIngGast = useRef<any>(null);
  const chartRentabilidad = useRef<any>(null);

  // Filter campaigns
  const filteredCampanas = useMemo(() => {
    return campanas.filter(campana => {
      const matchesSearch = campana.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campana.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterStatus === 'all' ||
                           (filterStatus === 'rentable' && (campana.rentabilidadReal || 0) >= 0) ||
                           (filterStatus === 'no-rentable' && (campana.rentabilidadReal || 0) < 0) ||
                           (filterStatus === 'activa' && campana.activo);

      return matchesSearch && matchesFilter;
    });
  }, [campanas, searchTerm, filterStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = campanas.length;
    const rentables = campanas.filter(c => (c.rentabilidadReal || 0) >= 0).length;
    const noRentables = total - rentables;
    const totalPresupuesto = campanas.reduce((sum, c) => sum + (c.presupuesto || 0), 0);
    const totalGastos = campanas.reduce((sum, c) => sum + (c.gastoTotalReal || 0), 0);
    const totalIngresos = campanas.reduce((sum, c) => sum + (c.ingresoTotalReal || 0), 0);
    const totalRentabilidad = campanas.reduce((sum, c) => sum + (c.rentabilidadReal || 0), 0);
    const totalHoras = campanas.reduce((sum, c) => sum + (c.horasInvertidas || 0), 0);

    return {
      total,
      rentables,
      noRentables,
      totalPresupuesto,
      totalGastos,
      totalIngresos,
      totalRentabilidad,
      totalHoras,
      porcentajeRentables: total > 0 ? Math.round((rentables / total) * 100) : 0
    };
  }, [campanas]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  // Validate dates
  const validateDates = (fechaInicio: string, fechaFin: string) => {
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      toast.error('La fecha de inicio no puede ser posterior a la fecha de fin');
      return false;
    }
    return true;
  };

  // Configure charts
  useEffect(() => {
    if (!campanas.length || !chartIngGastRef.current || !chartRentabilidadRef.current || !showCharts) return;

    // Check if Chart is available
    if (typeof Chart === 'undefined') {
      console.log('Chart.js no está disponible aún');
      return;
    }

    // Destroy existing charts
    if (chartIngGast.current && typeof chartIngGast.current.destroy === 'function') {
      chartIngGast.current.destroy();
    }
    if (chartRentabilidad.current && typeof chartRentabilidad.current.destroy === 'function') {
      chartRentabilidad.current.destroy();
    }

    // Income vs Expenses chart
    const ctxIG = chartIngGastRef.current.getContext('2d');
    if (ctxIG) {
      const labels = campanas.map(c => c.nombre);
      const ingresos = campanas.map(c => c.ingresoTotalReal || 0);
      const gastos = campanas.map(c => c.gastoTotalReal || 0);

      chartIngGast.current = new Chart(ctxIG, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Ingresos',
              data: ingresos,
              backgroundColor: '#10B981',
              borderColor: '#059669',
              borderWidth: 1
            },
            {
              label: 'Gastos',
              data: gastos,
              backgroundColor: '#EF4444',
              borderColor: '#DC2626',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Ingresos vs Gastos por Campaña'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => 'COP ' + value.toLocaleString('es-CO')
              }
            }
          }
        }
      });
    }

    // Profitability chart
    const ctxRent = chartRentabilidadRef.current.getContext('2d');
    if (ctxRent) {
      const labels = campanas.map(c => c.nombre);
      const rentabilidad = campanas.map(c => c.rentabilidadReal || 0);

      chartRentabilidad.current = new Chart(ctxRent, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Rentabilidad',
              data: rentabilidad,
              backgroundColor: rentabilidad.map(v => v >= 0 ? '#10B981' : '#EF4444'),
              borderColor: rentabilidad.map(v => v >= 0 ? '#059669' : '#DC2626'),
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Rentabilidad por Campaña'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => 'COP ' + value.toLocaleString('es-CO')
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartIngGast.current && typeof chartIngGast.current.destroy === 'function') {
        chartIngGast.current.destroy();
      }
      if (chartRentabilidad.current && typeof chartRentabilidad.current.destroy === 'function') {
        chartRentabilidad.current.destroy();
      }
    };
  }, [campanas, showCharts]);

  // Add new campaign
  const handleAgregarCampana = () => {
    const { nombre, fechaInicio, fechaFin, presupuesto, objetivoIngresos, descripcion } = formData;

    if (!nombre.trim()) {
      toast.error('Debe ingresar un nombre de campaña');
      return;
    }

    if (!fechaInicio || !fechaFin) {
      toast.error('Debe ingresar fechas de inicio y fin');
      return;
    }

    if (!validateDates(fechaInicio, fechaFin)) {
      return;
    }

    // Check for duplicates
    const existe = campanas.some(c => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
      toast.error('Ya existe una campaña con ese nombre');
      return;
    }

    createCampana.mutate({
      nombre: nombre.trim(),
      fechaInicio,
      fechaFin,
      presupuesto: presupuesto ? parseFloat(presupuesto) : 0,
      objetivoIngresos: objetivoIngresos ? parseFloat(objetivoIngresos) : 0,
      descripcion: descripcion.trim()
    });

    // Clear form
    setFormData({
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
      presupuesto: '',
      objetivoIngresos: '',
      descripcion: ''
    });
  };

  // Start editing
  const handleEdit = (campana: any) => {
    setEditingId(campana.id);
    setEditingData({
      nombre: campana.nombre,
      fechaInicio: campana.fechaInicio.split('T')[0],
      fechaFin: campana.fechaFin.split('T')[0],
      presupuesto: campana.presupuesto?.toString() || '',
      objetivoIngresos: campana.objetivoIngresos?.toString() || '',
      descripcion: campana.descripcion || ''
    });
  };

  // Save edit
  const handleSaveEdit = (id: number) => {
    const { nombre, fechaInicio, fechaFin, presupuesto, objetivoIngresos, descripcion } = editingData;

    if (!nombre.trim()) {
      toast.error('Debe ingresar un nombre de campaña');
      return;
    }

    if (!fechaInicio || !fechaFin) {
      toast.error('Debe ingresar fechas de inicio y fin');
      return;
    }

    if (!validateDates(fechaInicio, fechaFin)) {
      return;
    }

    updateCampana.mutate({
      id,
      data: {
        nombre: nombre.trim(),
        fechaInicio,
        fechaFin,
        presupuesto: presupuesto ? parseFloat(presupuesto) : 0,
        objetivoIngresos: objetivoIngresos ? parseFloat(objetivoIngresos) : 0,
        descripcion: descripcion.trim()
      }
    });

    setEditingId(null);
    setEditingData({});
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // Show delete modal
  const handleDelete = (campana: any) => {
    setDeletingCampana(campana);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deletingCampana) {
      deleteCampana.mutate(deletingCampana.id, {
        onSuccess: () => {
          setDeletingCampana(null);
        },
      });
    }
  };

  // Export campaigns
  const handleExportar = () => {
    const datosExportar = campanas.map(c => ({
      ID: c.id,
      Nombre: c.nombre,
      'Fecha Inicio': formatDate(c.fechaInicio),
      'Fecha Fin': formatDate(c.fechaFin),
      'Presupuesto': c.presupuesto,
      'Objetivo Ingresos': c.objetivoIngresos,
      'Horas Invertidas': c.horasInvertidas || 0,
      'Gasto Real': c.gastoTotalReal || 0,
      'Ingreso Real': c.ingresoTotalReal || 0,
      'Rentabilidad': c.rentabilidadReal || 0,
      'Notas': c.descripcion || ''
    }));

    const csvContent = [
      Object.keys(datosExportar[0]).join(','),
      ...datosExportar.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'campanas_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Datos de campañas exportados');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando campañas...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    console.error('Error loading campanas:', error);
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">
            <p>Error cargando campañas:</p>
            <p>{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <i className="bi bi-receipt text-blue-600"></i>
              Gestión de Gastos
            </h2>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="btn btn-outline flex items-center gap-2"
              >
                {showCharts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showCharts ? 'Ocultar' : 'Mostrar'} Gráficos
              </button>
              <button
                onClick={handleExportar}
                className="btn btn-success flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Campañas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Rentables</p>
                  <p className="text-2xl font-bold">{stats.rentables}</p>
                  <p className="text-xs opacity-80">{stats.porcentajeRentables}%</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">No Rentables</p>
                  <p className="text-2xl font-bold">{stats.noRentables}</p>
                </div>
                <TrendingDown className="h-8 w-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between">
      <div>
                  <p className="text-sm opacity-90">Rentabilidad Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRentabilidad)}</p>
                </div>
                <DollarSign className="h-8 w-8 opacity-80" />
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar campañas..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todas las campañas</option>
                <option value="rentable">Solo rentables</option>
                <option value="no-rentable">Solo no rentables</option>
                <option value="activa">Solo activas</option>
              </select>

              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {filteredCampanas.length} de {campanas.length} campañas
              </div>
            </div>
        </div>

          {/* Formulario de agregar campaña */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nueva Campaña
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nombre campaña"
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
              <input
                type="date"
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              />
              <input
                type="date"
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Presupuesto"
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.presupuesto}
                onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value })}
              />
              <input
                type="number"
                placeholder="Objetivo ingresos"
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.objetivoIngresos}
                onChange={(e) => setFormData({ ...formData, objetivoIngresos: e.target.value })}
              />
              <button
                onClick={handleAgregarCampana}
                disabled={createCampana.isPending}
                className="btn btn-primary flex items-center justify-center gap-2"
              >
                {createCampana.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Crear Campaña
              </button>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Ingresos vs Gastos
              </h3>
              <div className="h-80">
                <canvas ref={chartIngGastRef}></canvas>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-green-600" />
                Rentabilidad por Campaña
              </h3>
              <div className="h-80">
                <canvas ref={chartRentabilidadRef}></canvas>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de campañas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Lista de Campañas ({filteredCampanas.length})
          </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Target className="h-4 w-4 inline mr-1" />
                    Presupuesto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Horas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TrendingDown className="h-4 w-4 inline mr-1" />
                    Gasto Real
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    Ingreso Real
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Rentabilidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampanas.map((campana) => (
                  <tr key={campana.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      #{campana.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === campana.id ? (
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          value={editingData.nombre}
                          onChange={(e) => setEditingData({ ...editingData, nombre: e.target.value })}
                        />
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campana.nombre}</div>
                          {campana.descripcion && (
                            <div className="text-xs text-gray-500">{campana.descripcion}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === campana.id ? (
                        <div className="space-y-1">
                          <input
                            type="date"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editingData.fechaInicio}
                            onChange={(e) => setEditingData({ ...editingData, fechaInicio: e.target.value })}
                          />
                          <input
                            type="date"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editingData.fechaFin}
                            onChange={(e) => setEditingData({ ...editingData, fechaFin: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          <div>Inicio: {formatDate(campana.fechaInicio)}</div>
                          <div>Fin: {formatDate(campana.fechaFin)}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === campana.id ? (
                        <div className="space-y-1">
                          <input
                            type="number"
                            placeholder="Presupuesto"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editingData.presupuesto}
                            onChange={(e) => setEditingData({ ...editingData, presupuesto: e.target.value })}
                          />
                          <input
                            type="number"
                            placeholder="Objetivo"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editingData.objetivoIngresos}
                            onChange={(e) => setEditingData({ ...editingData, objetivoIngresos: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{formatCurrency(campana.presupuesto || 0)}</div>
                          <div className="text-xs text-gray-500">Obj: {formatCurrency(campana.objetivoIngresos || 0)}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        {(campana.horasInvertidas || 0) + 'h'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600 font-semibold">
                        {formatCurrency(campana.gastoTotalReal || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-600 font-semibold">
                        {formatCurrency(campana.ingresoTotalReal || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold flex items-center gap-1 ${
                        (campana.rentabilidadReal || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(campana.rentabilidadReal || 0) >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {formatCurrency(campana.rentabilidadReal || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === campana.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(campana.id)}
                            disabled={updateCampana.isPending}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors duration-150"
                            title="Guardar"
                          >
                            <Save className="h-4 w-4" />
                      </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors duration-150"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                      </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(campana)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors duration-150"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                      </button>
                          <button
                            onClick={() => handleDelete(campana)}
                            disabled={deleteCampana.isPending}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                      </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

          {filteredCampanas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron campañas con los filtros aplicados</p>
          </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .btn {
          @apply px-4 py-2 rounded-md font-medium transition-colors duration-150;
        }
        .btn-primary {
          @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
        }
        .btn-success {
          @apply bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2;
        }
        .btn-outline {
          @apply border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
        }
      `}</style>

      {/* Modal de eliminación */}
      {deletingCampana && (
        <DeleteCampaignModal
          campaignName={deletingCampana.nombre}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingCampana(null)}
          isDeleting={deleteCampana.isPending}
        />
      )}
    </MainLayout>
  );
}
