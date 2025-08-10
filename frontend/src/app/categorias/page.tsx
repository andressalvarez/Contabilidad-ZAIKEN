"use client";

import MainLayout from '@/components/layout/MainLayout';
import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Plus, Trash2, Tags, ChevronLeft, ChevronRight } from 'lucide-react';

// Simulación de datos (reemplazar por hooks reales)
const transaccionesData = [
  { id: 1, categoria: 'Publicidad (TikTok)' },
  { id: 2, categoria: 'Publicidad (Facebook)' },
  { id: 3, categoria: 'Dominio/Hosting' },
  { id: 4, categoria: 'Publicidad (Facebook)' },
  { id: 5, categoria: 'Venta / Ingreso campaña' },
  { id: 6, categoria: 'Publicidad (TikTok)' },
  { id: 7, categoria: 'Publicidad (Facebook)' },
  { id: 8, categoria: 'Publicidad (Facebook)' },
  { id: 9, categoria: 'Publicidad (Facebook)' },
  { id: 10, categoria: 'Publicidad (Facebook)' },
  { id: 11, categoria: 'Publicidad (Facebook)' },
  { id: 12, categoria: 'Publicidad (Facebook)' },
  { id: 13, categoria: 'Venta / Ingreso campaña' },
  { id: 14, categoria: 'Venta / Ingreso campaña' },
  { id: 15, categoria: 'Venta / Ingreso campaña' },
  { id: 16, categoria: 'Venta / Ingreso campaña' },
  { id: 17, categoria: 'Venta / Ingreso campaña' },
  { id: 18, categoria: 'Venta / Ingreso campaña' },
  { id: 19, categoria: 'Venta / Ingreso campaña' },
  { id: 20, categoria: 'Venta / Ingreso campaña' },
  { id: 21, categoria: 'Venta / Ingreso campaña' },
  { id: 22, categoria: 'Venta / Ingreso campaña' },
  { id: 23, categoria: 'Venta / Ingreso campaña' },
  { id: 24, categoria: 'Venta / Ingreso campaña' },
  { id: 25, categoria: 'Venta / Ingreso campaña' },
];
const gruposData = [
  { nombre: 'Gastos del negocio', color: '#f59e42', categorias: ['Publicidad (TikTok)', 'Publicidad (Facebook)'] },
  { nombre: 'Ingresos', color: '#3b82f6', categorias: ['Venta / Ingreso campaña'] },
];
const carpetasData = [
  { nombre: 'Ingresos netos / Gastos en campañas', grupos: ['Gastos del negocio', 'Ingresos'] },
];

const categoriasData = [
  { id: 1, nombre: 'Publicidad (TikTok)' },
  { id: 2, nombre: 'Publicidad (Facebook)' },
  { id: 3, nombre: 'Dominio/Hosting' },
  { id: 4, nombre: 'Aporte socio' },
  { id: 5, nombre: 'Venta / Ingreso campaña' },
];

export default function CategoriasPage() {
  const [data, setData] = useState(categoriasData);
  const [inputValue, setInputValue] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');

  // Calcular uso en transacciones
  const getUso = (nombre) =>
    transaccionesData.filter((t) => t.categoria === nombre).length;

  // Calcular grupos asignados
  const getGrupos = (nombre) =>
    gruposData.filter((g) => g.categorias.includes(nombre));

  // Validación de eliminación
  const canDelete = (nombre) => getUso(nombre) === 0 && getGrupos(nombre).length === 0;

  // Agregar categoría
  const handleAdd = () => {
    const nombre = inputValue.trim();
    if (!nombre) return alert('Por favor ingresa el nombre de la categoría');
    if (nombre.length < 2) return alert('El nombre debe tener al menos 2 caracteres');
    if (nombre.length > 50) return alert('El nombre no puede exceder 50 caracteres');
    if (data.some((cat) => cat.nombre.toLowerCase() === nombre.toLowerCase()))
      return alert('Ya existe una categoría con ese nombre');
    setData((prev) => [
      ...prev,
      { id: prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1, nombre },
    ]);
    setInputValue('');
  };

  // Eliminar categoría
  const handleDelete = (row) => {
    if (!canDelete(row.nombre)) {
      alert('No se puede eliminar: la categoría está en uso en transacciones o grupos');
      return;
    }
    if (window.confirm(`¿Eliminar la categoría "${row.nombre}"?`)) {
      setData(data.filter((cat) => cat.id !== row.id));
    }
  };

  // Columnas de la tabla
  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre de Categoría',
        cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
      },
      {
        id: 'uso',
        header: 'Uso en Transacciones',
        cell: ({ row }) => {
          const uso = getUso(row.original.nombre);
          let badgeClass = 'bg-gray-100 text-gray-800';
          if (uso > 10) badgeClass = 'bg-green-100 text-green-800';
          else if (uso > 5) badgeClass = 'bg-yellow-100 text-yellow-800';
          else if (uso > 0) badgeClass = 'bg-blue-100 text-blue-800';
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17v-2a4 4 0 014-4h14" /></svg>
              {uso} veces
            </span>
          );
        },
      },
      {
        id: 'grupos',
        header: 'Grupos Asignados',
        cell: ({ row }) => {
          const grupos = getGrupos(row.original.nombre);
          if (grupos.length === 0)
            return <span className="text-gray-400 text-sm">Sin grupos</span>;
          return grupos.slice(0, 2).map((g, i) => (
            <span key={g.nombre} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-1 mb-1" style={{ background: g.color + '22', color: g.color }}>
              <span className="w-2 h-2 rounded-full mr-1 inline-block" style={{ background: g.color }}></span>
              {g.nombre}
            </span>
          ));
        },
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <button
            className="inline-flex items-center px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
            onClick={() => handleDelete(row.original)}
            disabled={!canDelete(row.original.nombre)}
          >
            <Trash2 className="mr-1" size={16} /> Eliminar
          </button>
        ),
        size: 120,
      },
    ],
    [data]
  );

  // Configuración de la tabla
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      return String(row.getValue(columnId)).toLowerCase().includes(filterValue.toLowerCase());
    },
  });

  // Organización visual por grupos y carpetas
  const renderOrganizacion = () => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Organización por Grupos</h3>
          <p className="text-sm text-gray-600">Grupos activos organizados por carpetas</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Tags className="mr-1 h-4 w-4" /> {carpetasData.length} carpetas
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <Tags className="mr-1 h-4 w-4" /> {gruposData.length} grupos activos
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {carpetasData.map((carpeta) => (
            <div key={carpeta.nombre} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-4 h-4 rounded bg-blue-400"></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{carpeta.nombre}</h4>
                  <p className="text-sm text-gray-600">{carpeta.grupos.length} grupos activos</p>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white border border-gray-300">
                  Carpeta
                </span>
              </div>
              <div className="space-y-2">
                {carpeta.grupos.map((grupoNombre) => {
                  const grupo = gruposData.find((g) => g.nombre === grupoNombre);
                  if (!grupo) return null;
                  return (
                    <div key={grupo.nombre} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: grupo.color }}></div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{grupo.nombre}</div>
                          <div className="text-xs text-gray-500">
                            {grupo.categorias.length} categorías: {grupo.categorias.slice(0, 3).join(', ')}
                            {grupo.categorias.length > 3 ? '...' : ''}
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Tags className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nombre de la categoría"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold"
          >
            Agregar Categoría
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        {/* Organización visual por grupos y carpetas */}
        {renderOrganizacion()}
      </div>
    </MainLayout>
  );
}
