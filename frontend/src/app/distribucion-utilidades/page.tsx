'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { useDistribuciones, useDistribucionStats, useCreateDistribucion, useUpdateDistribucion, useDeleteDistribucion, useDistribuirAutomaticamente } from '@/hooks/useDistribucionUtilidades'
import { useUsuarios } from '@/hooks/useUsuarios'
import { DistribucionUtilidades } from '@/types'
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable, SortingState, ColumnFiltersState, getSortedRowModel } from '@tanstack/react-table'
import { Plus, Search, Edit, Trash2, Download, TrendingUp, Eye, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

const columnHelper = createColumnHelper<DistribucionUtilidades>()

export default function DistribucionUtilidadesPage() {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDistribucion, setSelectedDistribucion] = useState<DistribucionUtilidades | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    periodo: '',
    fecha: new Date().toISOString().split('T')[0],
    utilidadTotal: ''
  })

  // Chart refs
  const chartRef = useRef<HTMLCanvasElement>(null)

  // Queries
  const { data: distribuciones = [], isLoading, error } = useDistribuciones()
  const { data: stats } = useDistribucionStats()
  const { data: usuarios = [] } = useUsuarios()

  // Debug log para verificar datos
  console.log('🔍 Debug Distribución Utilidades:', {
    distribuciones: distribuciones.length,
    isLoading,
    error,
    stats: !!stats,
    usuarios: usuarios.length,
    primeraDistribucion: distribuciones[0]
  });

  // Mutations
  const createDistribucion = useCreateDistribucion()
  const deleteDistribucion = useDeleteDistribucion()
  const distribuirAutomaticamente = useDistribuirAutomaticamente()

  // Set current period as default
  useEffect(() => {
    if (!formData.periodo) {
      const ahora = new Date()
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      setFormData(prev => ({
        ...prev,
        periodo: `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`
      }))
    }
  }, [formData.periodo])

  // Configure chart
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart && distribuciones.length > 0 && chartRef.current) {
      console.log('🔍 Iniciando configuración del gráfico');
      console.log('📊 Distribuciones disponibles:', distribuciones.length);
      console.log('🎨 Chart ref:', chartRef.current);

      // Destroy existing chart
      const existingChart = window.Chart.getChart(chartRef.current);
      if (existingChart) {
        console.log('🗑️ Destruyendo gráfico anterior');
        existingChart.destroy();
      }

      const ctx = chartRef.current.getContext('2d')
      if (!ctx) {
        console.log('❌ No se pudo obtener el contexto 2D');
        return;
      }

      console.log('✅ Contexto 2D obtenido correctamente');

      // Prepare data for the chart
      const ultimas5 = distribuciones.slice(-5).reverse()
      const labels = ultimas5.map(d => d.periodo)
      const utilidades = ultimas5.map(d => d.utilidadTotal)
      const distribuidas = ultimas5.map(d => {
        const totalDistribuido = d.detalles?.reduce((acc, det) => acc + (det.montoDistribuido || 0), 0) || 0
        return totalDistribuido
      })

      console.log('📊 Datos del gráfico:', {
        labels,
        utilidades,
        distribuidas
      });

      // Create the chart
      new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Utilidad Total',
              data: utilidades,
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Distribuido',
              data: distribuidas,
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Utilidades - Últimos 5 Períodos'
            },
            legend: {
              position: 'top' as const
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
      console.log('✅ Gráfico creado exitosamente');
    }
  }, [distribuciones])

  // Define table columns
  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => info.getValue(),
      size: 60
    }),
    columnHelper.accessor('periodo', {
      header: 'Período',
      cell: info => info.getValue(),
      size: 120
    }),
    columnHelper.accessor('fecha', {
      header: 'Fecha',
      cell: info => new Date(info.getValue()).toLocaleDateString('es-CO'),
      size: 100
    }),
    columnHelper.accessor('utilidadTotal', {
      header: 'Utilidad Total',
      cell: info => {
        const value = info.getValue() || 0
        return 'COP ' + value.toLocaleString('es-CO')
      },
      size: 140
    }),
    columnHelper.accessor('estado', {
      header: 'Estado',
      cell: info => {
        const estado = info.getValue() || 'Pendiente'
        const color = estado === 'Distribuida' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            {estado}
          </span>
        )
      },
      size: 120
    }),
    columnHelper.accessor('detalles', {
      header: 'Distribuido',
      cell: info => {
        const detalles = info.getValue() || []
        const totalDistribuido = detalles.reduce((acc, det) => acc + (det.montoDistribuido || 0), 0)
        return 'COP ' + totalDistribuido.toLocaleString('es-CO')
      },
      size: 140
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: info => {
        const distribucion = info.row.original
        return (
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => handleVerDetalle(distribucion)}
              className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Ver detalle"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEliminar(distribucion)}
              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
      size: 100
    })
  ], [])

  // Configure table
  const table = useReactTable({
    data: distribuciones,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Handlers
  const handleCreate = () => {
    const { periodo, fecha, utilidadTotal } = formData

    // Validaciones
    if (!periodo || !fecha || !utilidadTotal) {
      toast.error('Por favor complete todos los campos')
      return
    }

    const utilidad = parseFloat(utilidadTotal)
    if (isNaN(utilidad) || utilidad <= 0) {
      toast.error('La utilidad debe ser mayor a 0')
      return
    }

    // Check for duplicates by period
    const existe = distribuciones.some(d =>
      d.periodo.toLowerCase() === periodo.toLowerCase()
    )

    if (existe) {
      if (!confirm('Ya existe una distribución para este período. ¿Desea continuar?')) {
        return
      }
    }

    createDistribucion.mutate({
      periodo,
      fecha,
      utilidadTotal: utilidad,
      estado: 'Pendiente'
    }, {
      onSuccess: (nuevaDistribucion) => {
        setIsCreateModalOpen(false)
        setFormData({
          periodo: '',
          fecha: new Date().toISOString().split('T')[0],
          utilidadTotal: ''
        })

        // Ask if user wants to distribute automatically
        if (distribuirAutomaticamente && confirm('¿Desea distribuir automáticamente las utilidades entre los usuarios activos?')) {
          distribuirAutomaticamente.mutate(nuevaDistribucion.id)
        }
      }
    })
  }

  const handleVerDetalle = (distribucion: DistribucionUtilidades) => {
    // Redirect to distribution detail view with filter
    router.push(`/distribucion-detalle?distribucionId=${distribucion.id}`)
  }

  const handleEliminar = (distribucion: DistribucionUtilidades) => {
    setSelectedDistribucion(distribucion)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (!selectedDistribucion) return

    const tieneDetalles = selectedDistribucion.detalles && selectedDistribucion.detalles.length > 0
    let mensaje = `¿Estás seguro de eliminar la distribución "${selectedDistribucion.periodo}"?`

    if (tieneDetalles) {
      mensaje += '\n\nEsto también eliminará todos los detalles de distribución asociados.'
    }

    if (confirm(mensaje)) {
      deleteDistribucion.mutate(selectedDistribucion.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false)
          setSelectedDistribucion(null)
        }
      })
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Período', 'Fecha', 'Utilidad Total', 'Estado', 'Distribuido'],
      ...distribuciones.map(d => [
        d.id,
        d.periodo,
        new Date(d.fecha).toLocaleDateString('es-CO'),
        d.utilidadTotal.toLocaleString('es-CO'),
        d.estado,
        (d.detalles?.reduce((acc, det) => acc + (det.montoDistribuido || 0), 0) || 0).toLocaleString('es-CO')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `distribucion-utilidades-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Distribución de Utilidades</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestión y cálculo de distribución de utilidades</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Distribución</span>
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Utilidades</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                  {stats ? 'COP ' + stats.totalUtilidades.toLocaleString('es-CO') : '...'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Distribuido</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                  {stats ? 'COP ' + stats.totalDistribuido.toLocaleString('es-CO') : '...'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Distribuciones</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900">
                  {stats ? stats.totalDistribuciones : '...'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900">
                  {stats ? stats.distribucionesPendientes : '...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Tendencia de Distribución</h3>
            <button
              onClick={() => {
                console.log('🔄 Forzando recreación del gráfico');
                if (typeof window !== 'undefined' && window.Chart && chartRef.current) {
                  const existingChart = window.Chart.getChart(chartRef.current);
                  if (existingChart) {
                    existingChart.destroy();
                  }
                  // Forzar re-render del useEffect
                  const event = new Event('resize');
                  window.dispatchEvent(event);
                }
              }}
              className="w-full sm:w-auto bg-blue-600 text-white px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1 rounded-lg sm:rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              Recargar Gráfico
            </button>
          </div>
          <div className="h-60 sm:h-72 lg:h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando gráfico...</span>
              </div>
            ) : distribuciones.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos para mostrar</h3>
                  <p className="text-gray-500">Crea una distribución de utilidades para ver la tendencia</p>
                </div>
              </div>
            ) : (
              <canvas ref={chartRef}></canvas>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Distribuciones de Utilidades</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                    className="w-full sm:w-48 lg:w-64 pl-10 pr-4 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={handleExport}
                  className="bg-green-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={table.getAllColumns().length} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                          <Search className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay distribuciones</h3>
                        <p className="text-sm sm:text-base text-gray-500 mb-4">No se encontraron distribuciones</p>
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Crear primera distribución</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="px-4 sm:px-6 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-2 min-h-[36px] border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-xs sm:text-sm text-gray-700">
                  {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-2 min-h-[36px] border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <span className="text-xs sm:text-sm text-gray-700">Mostrar</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded text-xs sm:text-sm py-1 min-h-[36px]"
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
                <span className="text-xs sm:text-sm text-gray-700 hidden sm:inline">filas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de creación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Nueva Distribución de Utilidades</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Período</label>
                <input
                  type="text"
                  value={formData.periodo}
                  onChange={e => setFormData(prev => ({ ...prev, periodo: e.target.value }))}
                  placeholder="Ej: Enero 2024"
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Utilidad Total</label>
                <input
                  type="number"
                  value={formData.utilidadTotal}
                  onChange={e => setFormData(prev => ({ ...prev, utilidadTotal: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={createDistribucion.isPending}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {createDistribucion.isPending ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              ¿Estás seguro de que quieres eliminar la distribución "{selectedDistribucion?.periodo}"?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteDistribucion.isPending}
                className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {deleteDistribucion.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
