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
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditar(info.row.original)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEliminar(info.row.original)}
            className="text-red-600 hover:text-red-800"
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando detalles de distribución...</span>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle de Distribución de Utilidades</h1>
            <p className="text-gray-600">Gestión detallada de distribución de utilidades por usuario</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                console.log('🎯 === CLICK EN BOTÓN NUEVO DETALLE ===');
                console.log('⏰ Timestamp:', new Date().toISOString());
                console.log('🔍 Estado ANTES del click:', isCreateModalOpen);
                console.log('🔍 Tipo de isCreateModalOpen:', typeof isCreateModalOpen);
                console.log('🔍 Función setIsCreateModalOpen:', typeof setIsCreateModalOpen);

                alert('Botón clickeado - Modal debería abrirse');

                console.log('🔄 Llamando a setIsCreateModalOpen(true)');
                setIsCreateModalOpen(true);

                console.log('✅ setIsCreateModalOpen(true) ejecutado');

                setTimeout(() => {
                  console.log('⏳ Estado DESPUÉS de 100ms:', isCreateModalOpen);
                }, 100);

                setTimeout(() => {
                  console.log('⏳ Estado DESPUÉS de 500ms:', isCreateModalOpen);
                }, 500);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Detalle</span>
            </button>
            <button
              onClick={handleDistribuirAutomaticamente}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Distribuir Automáticamente</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Distribución
              </label>
              <select
                value={selectedDistribucionId || ''}
                onChange={(e) => setSelectedDistribucionId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                &nbsp;
              </label>
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas de la distribución seleccionada */}
        {selectedDistribucion && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Utilidad Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    COP {selectedDistribucion.utilidadTotal.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Distribuido</p>
                  <p className="text-2xl font-bold text-gray-900">
                    COP {filteredDetalles.reduce((acc, d) => acc + d.montoDistribuido, 0).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredDetalles.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Participación</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredDetalles.reduce((acc, d) => acc + d.porcentajeParticipacion, 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico */}
        {filteredDetalles.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Usuario</h3>
            <div className="h-64">
              <canvas ref={chartRef} />
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Detalles de Distribución</h2>
              <div className="text-sm text-gray-600">
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={table.getAllColumns().length} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay detalles de distribución</h3>
                        <p className="text-gray-500 mb-4">No se encontraron detalles de distribución de utilidades</p>
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
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
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {table.getState().pagination.pageIndex + 1} de{' '}
                  {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Mostrar</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-700">filas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug: Estado del modal */}
      <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-50">
        Modal abierto: {isCreateModalOpen ? 'SÍ' : 'NO'}
      </div>

      {/* Modal Crear Detalle */}
      <Dialog.Root
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          console.log('🔄 Dialog.Root onOpenChange llamado con:', open);
          console.log('🔍 Estado anterior:', isCreateModalOpen);
          setIsCreateModalOpen(open);
          console.log('🔍 Estado nuevo:', open);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md"
            onEscapeKeyDown={() => setIsCreateModalOpen(false)}
            onInteractOutside={() => setIsCreateModalOpen(false)}
          >
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Nuevo Detalle de Distribución
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 mb-4">
              Complete los campos para crear un nuevo detalle de distribución de utilidades.
            </Dialog.Description>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distribución
                </label>
                <select
                  value={formData.distribucionId}
                  onChange={e => setFormData(prev => ({ ...prev, distribucionId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <select
                  value={formData.usuarioId}
                  onChange={e => setFormData(prev => ({ ...prev, usuarioId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participación (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.participacionPorc}
                  onChange={e => setFormData(prev => ({ ...prev, participacionPorc: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={createDetalle.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md"
            onEscapeKeyDown={() => setIsDeleteModalOpen(false)}
            onInteractOutside={() => setIsDeleteModalOpen(false)}
          >
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 mb-4">
              ¿Estás seguro de eliminar este detalle de distribución?
            </Dialog.Description>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteDetalle.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
