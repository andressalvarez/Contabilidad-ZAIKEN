'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, flexRender, createColumnHelper } from '@tanstack/react-table'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Search, Download, Edit, Trash2, Calculator, DollarSign, TrendingUp, Users, Settings, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { api, handleApiError } from '@/lib/api'
import MainLayout from '@/components/layout/MainLayout'

// Tipos
interface DistribucionUtilidades {
  id: number
  periodo: string
  fecha: string
  utilidadTotal: number
  estado: string
  detalles?: DistribucionDetalle[]
}

interface DistribucionDetalle {
  id: number
  distribucionId: number
  usuarioId: number
  porcentajeParticipacion: number
  montoDistribuido: number
  fecha: string
  usuario?: {
    id: number
    nombre: string
  }
  distribucion?: {
    id: number
    periodo: string
  }
}

interface Usuario {
  id: number
  nombre: string
  activo: boolean
}

interface Rol {
  id: number
  nombre: string
  salarioBase: number
}

// Column helper
const columnHelper = createColumnHelper<DistribucionDetalle>()

export default function DistribucionDetallePage() {
  console.log('🚀 Componente DistribucionDetallePage renderizado');

  const router = useRouter()
  const queryClient = useQueryClient()
  const chartRef = useRef<HTMLCanvasElement>(null)

  // Estados
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDetalle, setSelectedDetalle] = useState<DistribucionDetalle | null>(null)
  const [selectedDistribucionId, setSelectedDistribucionId] = useState<number | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [formData, setFormData] = useState({
    distribucionId: '',
    usuarioId: '',
    participacionPorc: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  // Queries
  const { data: detalles = [], isLoading } = useQuery({
    queryKey: ['distribucion-detalle'],
    queryFn: async () => {
      const response = await api.get('/distribucion-detalle')
      return response.data.data || []
    }
  })

  const { data: distribuciones = [] } = useQuery({
    queryKey: ['distribucion-utilidades'],
    queryFn: async () => {
      const response = await api.get('/distribucion-utilidades')
      return response.data.data || []
    }
  })

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const response = await api.get('/usuarios')
      return response.data.data || []
    }
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles')
      return response.data.data || []
    }
  })

  // Mutations
  const createDetalle = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/distribucion-detalle', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribucion-detalle'] })
      setIsCreateModalOpen(false)
      setFormData({
        distribucionId: '',
        usuarioId: '',
        participacionPorc: '',
        fecha: new Date().toISOString().split('T')[0]
      })
      toast.success('Detalle de distribución creado exitosamente')
    },
    onError: (error: any) => {
      toast.error(handleApiError(error))
    }
  })

  const deleteDetalle = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/distribucion-detalle/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribucion-detalle'] })
      setIsDeleteModalOpen(false)
      setSelectedDetalle(null)
      toast.success('Detalle de distribución eliminado exitosamente')
    },
    onError: (error: any) => {
      toast.error(handleApiError(error))
    }
  })

  // Filtros
  const filteredDetalles = useMemo(() => {
    return detalles.filter(detalle => {
      const matchesDistribucion = !selectedDistribucionId || detalle.distribucionId === selectedDistribucionId
      const matchesSearch = !globalFilter ||
        detalle.usuario?.nombre?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        detalle.distribucion?.periodo?.toLowerCase().includes(globalFilter.toLowerCase())
      return matchesDistribucion && matchesSearch
    })
  }, [detalles, selectedDistribucionId, globalFilter])

  const selectedDistribucion = useMemo(() => {
    return distribuciones.find(d => d.id === selectedDistribucionId)
  }, [distribuciones, selectedDistribucionId])

  // Handlers usando useCallback
  const handleCreate = useCallback(() => {
    if (!formData.distribucionId || !formData.usuarioId || !formData.participacionPorc) {
      toast.error('Por favor complete todos los campos')
      return
    }

    const data = {
      distribucionId: parseInt(formData.distribucionId),
      usuarioId: parseInt(formData.usuarioId),
      porcentajeParticipacion: parseFloat(formData.participacionPorc),
      fecha: formData.fecha
    }

    createDetalle.mutate(data)
  }, [formData, createDetalle])

  const handleEditar = useCallback((detalle: DistribucionDetalle) => {
    toast.info('Función de edición en desarrollo')
  }, [])

  const handleEliminar = useCallback((detalle: DistribucionDetalle) => {
    setSelectedDetalle(detalle)
    setIsDeleteModalOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (selectedDetalle) {
      deleteDetalle.mutate(selectedDetalle.id)
    }
  }, [selectedDetalle, deleteDetalle])

  const handleExport = useCallback(() => {
    toast.info('Función de exportación en desarrollo')
  }, [])

  const handleDistribuirAutomaticamente = useCallback(() => {
    if (!selectedDistribucionId) {
      toast.error('Por favor seleccione una distribución')
      return
    }

    const distribucion = distribuciones.find(d => d.id === selectedDistribucionId)
    if (!distribucion) {
      toast.error('Distribución no encontrada')
      return
    }

    const detallesExistentes = detalles.filter(d => d.distribucionId === selectedDistribucionId)
    if (detallesExistentes.length > 0) {
      toast.error('Esta distribución ya tiene detalles. Elimine los existentes primero.')
      return
    }

    const usuariosActivos = usuarios.filter(u => u.activo !== false)
    if (usuariosActivos.length === 0) {
      toast.error('No hay usuarios activos para distribuir')
      return
    }

    const totalSalarios = usuariosActivos.reduce((acc, usuario) => {
      const rol = roles.find(r => r.id === usuario.id)
      return acc + (rol?.salarioBase || 0)
    }, 0)

    if (totalSalarios === 0) {
      toast.error('No hay salarios base configurados')
      return
    }

    const detallesACrear = usuariosActivos.map(usuario => {
      const rol = roles.find(r => r.id === usuario.id)
      const salarioBase = rol?.salarioBase || 0
      const porcentaje = totalSalarios > 0 ? (salarioBase / totalSalarios) * 100 : 0
      const monto = (distribucion.utilidadTotal * porcentaje) / 100

      return {
        distribucionId: selectedDistribucionId,
        usuarioId: usuario.id,
        porcentajeParticipacion: porcentaje,
        montoDistribuido: monto,
        fecha: new Date().toISOString().split('T')[0]
      }
    })

    Promise.all(
      detallesACrear.map(detalle =>
        api.post('/distribucion-detalle', detalle)
      )
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ['distribucion-detalle'] })
      toast.success('Distribución automática completada')
    }).catch((error) => {
      toast.error('Error en la distribución automática')
      console.error(error)
    })
  }, [selectedDistribucionId, distribuciones, detalles, usuarios, roles, queryClient])

  // Columnas de la tabla usando useMemo
  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => info.getValue(),
      size: 60
    }),
    columnHelper.accessor('distribucion.periodo', {
      header: 'Distribución',
      cell: info => info.getValue() || 'N/A',
      size: 150
    }),
    columnHelper.accessor('usuario.nombre', {
      header: 'Usuario',
      cell: info => info.getValue() || 'N/A',
      size: 200
    }),
    columnHelper.accessor('porcentajeParticipacion', {
      header: 'Participación (%)',
      cell: info => `${info.getValue().toFixed(2)}%`,
      size: 120
    }),
    columnHelper.accessor('montoDistribuido', {
      header: 'Monto Distribuido',
      cell: info => `COP ${info.getValue().toLocaleString('es-CO')}`,
      size: 150
    }),
    columnHelper.accessor('fecha', {
      header: 'Fecha',
      cell: info => new Date(info.getValue()).toLocaleDateString('es-CO'),
      size: 120
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: info => (
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => handleEditar(info.row.original)}
            className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEliminar(info.row.original)}
            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      size: 100
    })
  ], [handleEditar, handleEliminar])

  // Tabla
  const table = useReactTable({
    data: filteredDetalles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter
  })

  // Effect for the chart
  useEffect(() => {
    if (chartRef.current && filteredDetalles.length > 0) {
      const ctx = chartRef.current.getContext('2d')
      if (ctx) {
        import('chart.js/auto').then(({ Chart }) => {
          if (chartRef.current?.chart) {
            chartRef.current.chart.destroy()
          }

          const chartData = {
            labels: filteredDetalles.map(d => d.usuario?.nombre || 'N/A'),
            datasets: [{
              label: 'Monto Distribuido',
              data: filteredDetalles.map(d => d.montoDistribuido),
              backgroundColor: [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
              ],
              borderWidth: 1
            }]
          }

          chartRef.current.chart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          })
        })
      }
    }

    return () => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.destroy()
      }
    }
  }, [filteredDetalles])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col sm:flex-row items-center justify-center h-64 gap-3 p-4">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          <span className="text-sm sm:text-base text-gray-600 text-center">Cargando detalles...</span>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Detalle de Distribución</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestión de distribución de utilidades por usuario</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Detalle</span>
            </button>
            <button
              onClick={handleDistribuirAutomaticamente}
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Distribuir</span> Auto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Filtrar por Distribución
              </label>
              <select
                value={selectedDistribucionId || ''}
                onChange={(e) => setSelectedDistribucionId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">Todas las distribuciones</option>
                {distribuciones.map(dist => (
                  <option key={dist.id} value={dist.id}>
                    {dist.periodo} - COP {dist.utilidadTotal.toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="sm:self-end">
              <button
                onClick={handleExport}
                className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas de la distribución seleccionada */}
        {selectedDistribucion && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Utilidad Total</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                    COP {selectedDistribucion.utilidadTotal.toLocaleString('es-CO')}
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
                    COP {filteredDetalles.reduce((acc, d) => acc + d.montoDistribuido, 0).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Usuarios</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900">
                    {filteredDetalles.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Participación</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900">
                    {filteredDetalles.reduce((acc, d) => acc + d.porcentajeParticipacion, 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico */}
        {filteredDetalles.length > 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Distribución por Usuario</h3>
            <div className="h-48 sm:h-56 lg:h-64">
              <canvas ref={chartRef} />
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Detalles de Distribución</h2>
              <div className="text-xs sm:text-sm text-gray-600">
                {filteredDetalles.length} registros
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
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay detalles</h3>
                        <p className="text-sm sm:text-base text-gray-500 mb-4">No se encontraron detalles de distribución</p>
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Crear primer detalle</span>
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
                  className="px-3 py-2 min-h-[36px] text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-xs sm:text-sm text-gray-700">
                  {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-2 min-h-[36px] text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <span className="text-xs sm:text-sm text-gray-700">Mostrar</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm min-h-[36px]"
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

      {/* Modal Crear Detalle */}
      <Dialog.Root open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 w-[calc(100%-24px)] sm:w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            onEscapeKeyDown={() => setIsCreateModalOpen(false)}
            onInteractOutside={() => setIsCreateModalOpen(false)}
          >
            <Dialog.Title className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Nuevo Detalle de Distribución
            </Dialog.Title>
            <Dialog.Description className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Complete los campos para crear un nuevo detalle.
            </Dialog.Description>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Distribución
                </label>
                <select
                  value={formData.distribucionId}
                  onChange={e => setFormData(prev => ({ ...prev, distribucionId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">-- Seleccione distribución --</option>
                  {distribuciones.map(dist => (
                    <option key={dist.id} value={dist.id}>
                      {dist.periodo} - COP {dist.utilidadTotal.toLocaleString('es-CO')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Usuario
                </label>
                <select
                  value={formData.usuarioId}
                  onChange={e => setFormData(prev => ({ ...prev, usuarioId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">-- Seleccione usuario --</option>
                  {usuarios.filter(u => u.activo !== false).map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Participación (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.participacionPorc}
                  onChange={e => setFormData(prev => ({ ...prev, participacionPorc: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={createDetalle.isPending}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {createDetalle.isPending ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal Confirmar Eliminación */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 w-[calc(100%-24px)] sm:w-full max-w-md shadow-2xl"
            onEscapeKeyDown={() => setIsDeleteModalOpen(false)}
            onInteractOutside={() => setIsDeleteModalOpen(false)}
          >
            <Dialog.Title className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Confirmar Eliminación
            </Dialog.Title>
            <Dialog.Description className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              ¿Estás seguro de eliminar este detalle de distribución?
            </Dialog.Description>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteDetalle.isPending}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {deleteDetalle.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </MainLayout>
  )
}
