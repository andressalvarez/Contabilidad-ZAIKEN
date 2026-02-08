'use client'

import { useEffect, useRef, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { useDashboard } from '@/hooks/useDashboard'
import TestConnection from '@/components/TestConnection'

export default function Home() {
  const chartRef1 = useRef<HTMLCanvasElement>(null)
  const chartRef2 = useRef<HTMLCanvasElement>(null)
  const [filtros, setFiltros] = useState({
    fechaInicio: '2025-01-01',
    fechaFin: '2025-12-31'
  })

  const { data: dashboardData, isLoading } = useDashboard(filtros)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CO').format(num);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart && dashboardData) {
      // Destroy existing charts
      if (chartRef1.current) {
        const existingChart1 = window.Chart.getChart(chartRef1.current);
        if (existingChart1) {
          existingChart1.destroy();
        }
      }
      if (chartRef2.current) {
        const existingChart2 = window.Chart.getChart(chartRef2.current);
        if (existingChart2) {
          existingChart2.destroy();
        }
      }

      // Chart 1: Income vs Expenses (Bars)
      if (chartRef1.current) {
        const ctx1 = chartRef1.current.getContext('2d')
        if (ctx1) {
          new window.Chart(ctx1, {
            type: 'bar',
            data: {
              labels: ['Ingresos', 'Gastos'],
              datasets: [{
                data: [dashboardData.estadisticas.totalIngresos, dashboardData.estadisticas.totalGastos],
                backgroundColor: ['#10B981', '#EF4444'],
                borderWidth: 0,
                borderRadius: 8
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value: any) {
                      return '$' + (value / 1000000).toFixed(1) + 'M'
                    }
                  }
                }
              }
            }
          })
        }
      }

      // Chart 2: Expenses by Categories (Doughnut)
      if (chartRef2.current && dashboardData.gastosPorCampana.length > 0) {
        const ctx2 = chartRef2.current.getContext('2d')
        if (ctx2) {
          const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16',
            '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E', '#A855F7', '#EAB308',
            '#22C55E', '#F97316', '#EC4899', '#6366F1', '#14B8A6'
          ];

          new window.Chart(ctx2, {
            type: 'doughnut',
            data: {
              labels: dashboardData.gastosPorCampana.map(item => item.campana),
              datasets: [{
                data: dashboardData.gastosPorCampana.map(item => item.monto),
                backgroundColor: colors.slice(0, dashboardData.gastosPorCampana.length),
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 15,
                    usePointStyle: true,
                    font: {
                      size: 10
                    }
                  }
                }
              }
            }
          })
        }
      }
    }
  }, [dashboardData])

  const handleFiltrar = () => {
    // Filters are automatically updated with state
  };

  const handleLimpiar = () => {
    setFiltros({
      fechaInicio: '2025-01-01',
      fechaFin: '2025-12-31'
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando dashboard...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Prueba de conexión temporal */}
        <TestConnection />

        {/* Filtros de fecha - Responsive */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Dashboard de Resúmenes</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Desde:</label>
                <input
                  type="date"
                  className="flex-1 sm:flex-none border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Hasta:</label>
                <input
                  type="date"
                  className="flex-1 sm:flex-none border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                onClick={handleFiltrar}
              >
                Filtrar
              </button>
              <button
                className="flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                onClick={handleLimpiar}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Métricas principales - Primera fila (2 cols en mobile, 4 en desktop) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-green-100 text-xs sm:text-sm font-medium mb-1">Ingresos</h3>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(dashboardData?.estadisticas.totalIngresos || 0)}</p>
              </div>
              <div className="text-green-200 text-2xl sm:text-4xl ml-2 flex-shrink-0">
                <i className="bi bi-arrow-up-circle"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-red-100 text-xs sm:text-sm font-medium mb-1">Gastos</h3>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(dashboardData?.estadisticas.totalGastos || 0)}</p>
              </div>
              <div className="text-red-200 text-2xl sm:text-4xl ml-2 flex-shrink-0">
                <i className="bi bi-arrow-down-circle"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Balance</h3>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(dashboardData?.estadisticas.balance || 0)}</p>
              </div>
              <div className="text-blue-200 text-2xl sm:text-4xl ml-2 flex-shrink-0">
                <i className="bi bi-calculator"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-orange-100 text-xs sm:text-sm font-medium mb-1">Horas Totales</h3>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">{formatNumber(dashboardData?.usuarios?.horasTotales || 0)} hrs</p>
              </div>
              <div className="text-orange-200 text-2xl sm:text-4xl ml-2 flex-shrink-0">
                <i className="bi bi-clock"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas secundarias - Segunda fila (2 cols mobile, 5 en desktop) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">APORTES</h3>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(dashboardData?.usuarios?.aportesTotales || 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">UTILIDADES</h3>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">TRANSACCIONES</h3>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatNumber(dashboardData?.estadisticas.totalTransacciones || 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">PERSONAS</h3>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatNumber(dashboardData?.usuarios?.totalUsuarios || 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 col-span-2 lg:col-span-1">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">TIPOS GASTO</h3>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatNumber(dashboardData?.campanas.totalCampanas || 0)}</p>
          </div>
        </div>

        {/* Gráficos - Stack en mobile, side by side en desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gráfico 1: Ingresos vs Gastos */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Ingresos vs Gastos</h3>
            <div className="h-60 sm:h-72 lg:h-80">
              <canvas ref={chartRef1}></canvas>
            </div>
          </div>

          {/* Gráfico 2: Gastos por Categorías */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Gastos por Categorías</h3>
            <div className="h-60 sm:h-72 lg:h-80">
              <canvas ref={chartRef2}></canvas>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
