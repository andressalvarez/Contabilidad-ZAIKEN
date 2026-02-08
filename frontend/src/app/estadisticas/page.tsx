'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTransacciones } from '@/hooks/useTransacciones';
import { useEstadisticas, useTendenciasMensuales, useResumenPorCategorias, useEstadisticasCampanas } from '@/hooks/useEstadisticas';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useCampanas } from '@/hooks/useCampanas';
import { useRoles } from '@/hooks/useRoles';
import { Transaccion } from '@/types';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  DollarSign,
  Users,
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  FolderOpen,
  FolderClosed,
  ChevronDown,
  ChevronRight,
  Palette,
  Save,
  X,
  Plus,
  Edit3,
  Trash2,
  FileText,
  BarChart,
  List,
  Grid3X3,
  User
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import VsCategoriasDrillDown from '@/components/estadisticas/VsCategoriasDrillDown';
import { Chart, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

export default function EstadisticasPage() {
  // Estados principales
  const [showCharts, setShowCharts] = useState(true);
  const [filters, setFilters] = useState({
    usuarioId: '',
    fechaInicio: '',
    fechaFin: '',
    tipo: ''
  });

  // States for VS Categories
  const [vsCategoriasConfig, setVsCategoriasConfig] = useState({
    carpetas: {},
    grupos: {},
    colores: {},
    configuracion: {}
  });

  // References for charts
  const chartsRef = useRef<{ [key: string]: Chart }>({});
  const vsCategoriasRef = useRef<any>(null);

  // Current year for trends
  const añoActual = new Date().getFullYear();

  // Data hooks
  const { data: stats } = useEstadisticas(filters);
  const { data: usuarios = [] } = useUsuarios();
  const { data: campanas = [] } = useCampanas();
  const { data: roles = [] } = useRoles();
  const { data: tendenciasMensuales = [], isLoading: loadingTendencias } = useTendenciasMensuales(añoActual, filters);
  const { data: resumenCategorias = [], isLoading: loadingCategorias } = useResumenPorCategorias(filters);
  const { data: estadisticasCampanas } = useEstadisticasCampanas(filters);

  // Generate colors for charts
  const generateColors = (count: number) => {
    const colors = [
      '#6366f1', '#f59e42', '#10b981', '#ef4444', '#fbbf24',
      '#3b82f6', '#a21caf', '#eab308', '#0ea5e9', '#f472b6',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899'
    ];
    return colors.slice(0, count);
  };

  // Function to create responsive charts
  const createResponsiveChart = (canvasId: string, config: any) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return null;

    // Destroy existing chart if it exists
    if (chartsRef.current[canvasId]) {
      chartsRef.current[canvasId].destroy();
    }

    // Responsive base configuration
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          displayColors: true,
          bodySpacing: 6
        }
      }
    };

    // Merge configuraciones
    config.options = { ...defaultOptions, ...config.options };

    const chart = new Chart(canvas, config);
    chartsRef.current[canvasId] = chart;
    return chart;
  };

  // Create clean external legend
  const createCleanExternalLegend = (container: HTMLElement, data: any[], title: string) => {
    const legendContainer = document.createElement('div');
    legendContainer.className = 'chart-legend';
    legendContainer.innerHTML = `
      <div class="legend-header">
        <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
      </div>
      <div class="legend-items grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
        ${data.map((item, index) => `
          <div class="legend-item flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
            <div class="w-4 h-4 rounded" style="background-color: ${item.color}"></div>
            <span class="text-sm font-medium text-gray-700">${item.label}</span>
            <span class="text-sm text-gray-500 ml-auto">${item.value}</span>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(legendContainer);
  };

  // Render Income vs Expenses chart
  const renderIngresosGastos = () => {
    console.log('DEBUG renderIngresosGastos - stats:', stats);
    if (!stats) {
      console.log('DEBUG renderIngresosGastos - No hay stats');
      return;
    }

    const ingresos = stats.ingresos || 0;
    const gastos = stats.gastos || 0;
    const utilidad = ingresos - gastos;

    console.log('DEBUG renderIngresosGastos - Valores:', { ingresos, gastos, utilidad });

    const data = [
      { label: 'Ingresos', value: ingresos, color: '#10b981' },
      { label: 'Gastos', value: gastos, color: '#ef4444' },
      { label: 'Utilidad', value: utilidad, color: '#3b82f6' }
    ];

    console.log('DEBUG renderIngresosGastos - Data para gráfico:', data);

    const chart = createResponsiveChart('ingresosGastosChart', {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: data.map(d => d.color),
          borderColor: data.map(d => d.color),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)',
              drawBorder: false,
            },
            ticks: {
              callback: (value: any) => `$${value.toLocaleString()}`,
              font: {
                size: 12,
                weight: '500'
              },
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                weight: '600'
              },
              color: '#374151'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            bodySpacing: 6,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                return `${context.label}: $${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });

    // Create improved external legend
    const container = document.getElementById('ingresosGastosContainer');
    if (container) {
      const existingLegend = container.querySelector('.chart-legend');
      if (existingLegend) existingLegend.remove();

      const legendContainer = document.createElement('div');
      legendContainer.className = 'chart-legend mt-6';
      legendContainer.innerHTML = `
        <div class="legend-header mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Resumen Financiero</h3>
          <p class="text-sm text-gray-600">Análisis de ingresos, gastos y utilidad</p>
        </div>
        <div class="legend-items grid grid-cols-1 md:grid-cols-3 gap-4">
          ${data.map((item, index) => `
            <div class="legend-item bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-4 h-4 rounded-full" style="background-color: ${item.color}"></div>
                <span class="text-sm font-semibold text-gray-800">${item.label}</span>
              </div>
              <div class="text-2xl font-bold" style="color: ${item.color}">
                $${item.value.toLocaleString()}
              </div>
              <div class="text-xs text-gray-500 mt-1">
                ${index === 2 ? 'Balance neto' : index === 0 ? 'Total recibido' : 'Total gastado'}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(legendContainer);
    }
  };

  // Render Expenses by Category chart
  const renderGastosCategoria = () => {
    console.log('DEBUG resumenCategorias:', resumenCategorias);
    if (!resumenCategorias || resumenCategorias.length === 0) return;

    const top10 = resumenCategorias.slice(0, 10);
    const colors = generateColors(top10.length);
    // Use totalGastos as main field
    const total = top10.reduce((sum, item) => sum + (item.totalGastos || 0), 0);

    const chart = createResponsiveChart('gastosCategoriaChart', {
      type: 'doughnut',
      data: {
        labels: top10.map(item => item.categoria),
        datasets: [{
          data: top10.map(item => item.totalGastos || 0),
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'),
          borderWidth: 3,
          hoverBorderWidth: 4,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            bodySpacing: 6,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    // Create improved external legend
    const container = document.getElementById('gastosCategoriaContainer');
    if (container) {
      const existingLegend = container.querySelector('.chart-legend');
      if (existingLegend) existingLegend.remove();

      const legendContainer = document.createElement('div');
      legendContainer.className = 'chart-legend mt-6';
      legendContainer.innerHTML = `
        <div class="legend-header mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Top 10 Gastos por Categoría</h3>
          <p class="text-sm text-gray-600">Total: $${total.toLocaleString()}</p>
        </div>
        <div class="legend-items space-y-2 max-h-64 overflow-y-auto">
          ${top10.map((item, index) => {
            const value = item.totalGastos || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `
              <div class="legend-item flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 rounded-full" style="background-color: ${colors[index]}"></div>
                  <span class="text-sm font-medium text-gray-800">${item.categoria}</span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-gray-900">$${value.toLocaleString()}</div>
                  <div class="text-xs text-gray-500">${percentage}%</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      container.appendChild(legendContainer);
    }
  };

  // Render Campaign Performance chart
  const renderCampanasPerformance = () => {
    // Use specific campaign statistics hook
    const campanasConStats = estadisticasCampanas || [];
    console.log('DEBUG campanas desde estadisticasCampanas:', campanasConStats);

    if (!Array.isArray(campanasConStats) || campanasConStats.length === 0) {
      // Show no data message
      const container = document.getElementById('campanasPerformanceContainer');
      if (container) {
        const canvas = container.querySelector('canvas');
        if (canvas && canvas.getContext) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        let msg = container.querySelector('.chart-legend');
        if (!msg) {
          msg = document.createElement('div');
          msg.className = 'chart-legend mt-6';
          container.appendChild(msg);
        }
        msg.innerHTML = `<div class='text-center text-gray-500 py-8'>Sin datos de campañas</div>`;
      }
      return;
    }

    // Show all campaigns with activity (income or expenses > 0) and sort by expenses
    const campanasConActividad = campanasConStats
      .filter((c: any) => (c.ingresos > 0 || c.gastos > 0))
      .sort((a: any, b: any) => b.gastos - a.gastos)
      .slice(0, 10);

    if (campanasConActividad.length === 0) {
      // Show message if no campaigns with activity
      const container = document.getElementById('campanasPerformanceContainer');
      if (container) {
        let msg = container.querySelector('.chart-legend');
        if (!msg) {
          msg = document.createElement('div');
          msg.className = 'chart-legend mt-6';
          container.appendChild(msg);
        }
        msg.innerHTML = `<div class='text-center text-gray-500 py-8'>No hay campañas con actividad financiera</div>`;
      }
      return;
    }

    const colors = generateColors(campanasConActividad.length);

    const chart = createResponsiveChart('campanasPerformanceChart', {
      type: 'bar',
      data: {
        labels: campanasConActividad.map((c: any) => c.nombre),
        datasets: [{
          label: 'Gastos',
          data: campanasConActividad.map((c: any) => c.gastos),
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)',
              drawBorder: false,
            },
            ticks: {
              callback: (value: any) => `$${value.toLocaleString()}`,
              font: {
                size: 12,
                weight: '500'
              },
              color: '#6b7280'
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                weight: '600'
              },
              color: '#374151',
              maxRotation: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            bodySpacing: 6,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.x;
                return `Gastos: $${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });

    // Create improved external legend
    const container = document.getElementById('campanasPerformanceContainer');
    if (container) {
      const existingLegend = container.querySelector('.chart-legend');
      if (existingLegend) existingLegend.remove();

      const legendContainer = document.createElement('div');
      legendContainer.className = 'chart-legend mt-6';

      const totalGastos = campanasConActividad.reduce((sum, c) => sum + c.gastos, 0);
      const totalIngresos = campanasConActividad.reduce((sum, c) => sum + c.ingresos, 0);

      legendContainer.innerHTML = `
        <div class="legend-header mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Top 10 Campañas por Gastos</h3>
          <div class="flex gap-4 text-sm text-gray-600">
            <span>Total Gastos: $${totalGastos.toLocaleString()}</span>
            <span>Total Ingresos: $${totalIngresos.toLocaleString()}</span>
            <span>Campañas: ${campanasConActividad.length}</span>
          </div>
        </div>
        <div class="legend-items space-y-2 max-h-64 overflow-y-auto">
          ${campanasConActividad.map((campana: any, index: number) => {
            const gastos = campana.gastos || 0;
            const ingresos = campana.ingresos || 0;
            const utilidad = campana.utilidad || 0;
            return `
              <div class="legend-item flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 rounded-full" style="background-color: ${colors[index]}"></div>
                  <span class="text-sm font-medium text-gray-800">${campana.nombre}</span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-gray-900">
                    Gastos: $${gastos.toLocaleString()}
                  </div>
                  <div class="text-xs text-gray-500">
                    Ingresos: $${ingresos.toLocaleString()} | Utilidad: $${utilidad.toLocaleString()}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      container.appendChild(legendContainer);
    }
  };

  // Render Contributions and Profits chart
  const renderAportesUtilidades = () => {
    // Use basic user data directly as it already has the correct data
    const datosUsuarios = usuarios || [];
    console.log('DEBUG datosUsuarios desde usuarios:', datosUsuarios);

    // Filter users with any financial activity
    const usuariosConActividad = datosUsuarios.filter((u: any) =>
      (u.aportesTotales > 0 || u.inversionTotal > 0 || u.horasTotales > 0)
    );

    console.log('DEBUG usuariosConActividad filtradas:', usuariosConActividad);

    if (!Array.isArray(usuariosConActividad) || usuariosConActividad.length === 0) {
      // Show no data message or clear the canvas
      const container = document.getElementById('aportesUtilidadesContainer');
      if (container) {
        const canvas = container.querySelector('canvas');
        if (canvas && canvas.getContext) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        let msg = container.querySelector('.chart-legend');
        if (!msg) {
          msg = document.createElement('div');
          msg.className = 'chart-legend mt-6';
          container.appendChild(msg);
        }
        msg.innerHTML = `<div class='text-center text-gray-500 py-8'>Sin datos de aportes/utilidades por usuario</div>`;
      }
      return;
    }

    const colors = generateColors(usuariosConActividad.length);

    const chart = createResponsiveChart('aportesUtilidadesChart', {
      type: 'bar',
      data: {
        labels: usuariosConActividad.map((u: any) => u.nombre),
        datasets: [
          {
            label: 'Aportes Totales',
            data: usuariosConActividad.map((u: any) => u.aportesTotales || 0),
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)',
              drawBorder: false,
            },
            ticks: {
              callback: (value: any) => `$${value.toLocaleString()}`,
              font: {
                size: 12,
                weight: '500'
              },
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                weight: '600'
              },
              color: '#374151',
              maxRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            display: false // Ocultar leyenda ya que solo hay un dataset
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            bodySpacing: 6,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                return `Aportes: $${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });

    // Create improved external legend
    const container = document.getElementById('aportesUtilidadesContainer');
    if (container) {
      const existingLegend = container.querySelector('.chart-legend');
      if (existingLegend) existingLegend.remove();

      const legendContainer = document.createElement('div');
      legendContainer.className = 'chart-legend mt-6';

      const totalAportes = usuariosConActividad.reduce((sum, u) => sum + (u.aportesTotales || 0), 0);
      const totalInversion = usuariosConActividad.reduce((sum, u) => sum + (u.inversionTotal || 0), 0);
      const totalHoras = usuariosConActividad.reduce((sum, u) => sum + (u.horasTotales || 0), 0);

      legendContainer.innerHTML = `
        <div class="legend-header mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Aportes por Usuario</h3>
          <div class="flex gap-4 text-sm text-gray-600">
            <span>Total Aportes: $${totalAportes.toLocaleString()}</span>
            <span>Usuarios: ${usuariosConActividad.length}</span>
          </div>
        </div>
        <div class="legend-items space-y-2 max-h-64 overflow-y-auto">
          ${usuariosConActividad.map((usuario, index) => {
            const aportes = usuario.aportesTotales || 0;
            const participacion = usuario.participacionPorc || 0;
            return `
              <div class="legend-item flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 rounded-full" style="background-color: ${colors[index]}"></div>
                  <span class="text-sm font-medium text-gray-800">${usuario.nombre}</span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-gray-900">
                    $${aportes.toLocaleString()}
                  </div>
                  <div class="text-xs text-gray-500">
                    Participación: ${participacion}%
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      container.appendChild(legendContainer);
    }
  };

  // Render all charts
  const renderGraficas = () => {
    renderIngresosGastos();
    renderGastosCategoria();
    renderCampanasPerformance();
    renderAportesUtilidades();
  };

  // Reload charts
  const recargarGraficos = () => {
    toast.success('Recargando gráficos...');
    renderGraficas();
  };

  // Clean up charts on unmount
  useEffect(() => {
    return () => {
      Object.values(chartsRef.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, []);

  // Render charts when data changes
  useEffect(() => {
    if (showCharts) {
      setTimeout(() => {
        renderGraficas();
      }, 100);
    }
  }, [stats, resumenCategorias, campanas, usuarios, showCharts]);

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="text-blue-600" size={24} />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Estadísticas</h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 ml-10 sm:ml-12">Análisis completo del rendimiento financiero y operativo</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300 text-sm sm:text-base"
              >
                {showCharts ? <EyeOff size={18} /> : <Eye size={18} />}
                <span className="hidden sm:inline">{showCharts ? 'Ocultar' : 'Mostrar'} Gráficos</span>
                <span className="sm:hidden">{showCharts ? 'Ocultar' : 'Ver'}</span>
              </button>

              <button
                onClick={recargarGraficos}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm text-sm sm:text-base"
              >
                <RefreshCw size={18} />
                Recargar
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Filter className="text-orange-600" size={18} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Filtros de Análisis</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                Usuario
              </label>
              <select
                value={filters.usuarioId}
                onChange={(e) => setFilters(prev => ({ ...prev, usuarioId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Todos los usuarios</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>{usuario.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-1" />
                Tipo
              </label>
              <select
                value={filters.tipo}
                onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Todos los tipos</option>
                <option value="INGRESO">Ingresos</option>
                <option value="GASTO">Gastos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        {showCharts && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Primera fila - Ingresos vs Gastos y Gastos por Categoría */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Ingresos vs Gastos */}
              <div id="ingresosGastosContainer" className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="text-green-600" size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">Ingresos vs Gastos</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Análisis financiero general</p>
                  </div>
                </div>
                <div className="relative h-60 sm:h-72 lg:h-80">
                  <canvas id="ingresosGastosChart"></canvas>
                </div>
              </div>

              {/* Gastos por Categoría */}
              <div id="gastosCategoriaContainer" className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <PieChart className="text-red-600" size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">Gastos por Categoría</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Top 10 categorías de gasto</p>
                  </div>
                </div>
                <div className="relative h-60 sm:h-72 lg:h-80">
                  <canvas id="gastosCategoriaChart"></canvas>
                </div>
              </div>
            </div>

            {/* Segunda fila - Performance de Campañas y Aportes y Utilidades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Performance de Campañas */}
              <div id="campanasPerformanceContainer" className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="text-blue-600" size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">Performance de Campañas</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Ranking por utilidad generada</p>
                  </div>
                </div>
                <div className="relative h-60 sm:h-72 lg:h-80">
                  <canvas id="campanasPerformanceChart"></canvas>
                </div>
              </div>

              {/* Aportes por Usuario */}
              <div id="aportesUtilidadesContainer" className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="text-purple-600" size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">Aportes por Usuario</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Contribuciones totales por usuario</p>
                  </div>
                </div>
                <div className="relative h-60 sm:h-72 lg:h-80">
                  <canvas id="aportesUtilidadesChart"></canvas>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VS Categorías Drill Down */}
        <VsCategoriasDrillDown
          ref={vsCategoriasRef}
          filters={filters}
          config={vsCategoriasConfig}
          onConfigChange={setVsCategoriasConfig}
        />
      </div>
    </MainLayout>
  );
}
