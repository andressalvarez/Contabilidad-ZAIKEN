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
import { Plus, Trash2, Tags, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useCategorias, useCreateCategoria, useDeleteCategoria } from '@/hooks/useCategorias';
import { useTransacciones } from '@/hooks/useTransacciones';

export default function CategoriasPage() {
  const [inputValue, setInputValue] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');

  // Fetch data from backend
  const { data: categorias = [], isLoading, error } = useCategorias();
  const { data: transacciones = [] } = useTransacciones();
  const createCategoriaMutation = useCreateCategoria();
  const deleteCategoriaMutation = useDeleteCategoria();

  // Calcular uso en transacciones por categoriaId
  const getUso = (categoriaId: number) =>
    transacciones.filter((t: any) => t.categoriaId === categoriaId).length;

  // Agregar categoría
  const handleAdd = () => {
    const nombre = inputValue.trim();
    if (!nombre) {
      alert('Por favor ingresa el nombre de la categoría');
      return;
    }
    if (nombre.length < 2) {
      alert('El nombre debe tener al menos 2 caracteres');
      return;
    }
    if (nombre.length > 50) {
      alert('El nombre no puede exceder 50 caracteres');
      return;
    }
    if (categorias.some((cat: any) => cat.nombre.toLowerCase() === nombre.toLowerCase())) {
      alert('Ya existe una categoría con ese nombre');
      return;
    }

    createCategoriaMutation.mutate({ nombre }, {
      onSuccess: () => {
        setInputValue('');
      },
    });
  };

  // Eliminar categoría
  const handleDelete = (categoria: any) => {
    const uso = getUso(categoria.id);
    if (uso > 0) {
      alert(`No se puede eliminar: la categoría está en uso en ${uso} transacción(es)`);
      return;
    }
    if (window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
      deleteCategoriaMutation.mutate(categoria.id);
    }
  };

  // Columnas de la tabla
  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
        cell: (info: any) => info.getValue(),
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre de Categoría',
        cell: (info: any) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
      },
      {
        id: 'uso',
        header: 'Uso en Transacciones',
        cell: ({ row }: any) => {
          const uso = getUso(row.original.id);
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
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }: any) => {
          const uso = getUso(row.original.id);
          return (
            <button
              className="inline-flex items-center px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleDelete(row.original)}
              disabled={uso > 0 || deleteCategoriaMutation.isPending}
            >
              {deleteCategoriaMutation.isPending ? (
                <Loader2 className="mr-1 animate-spin" size={16} />
              ) : (
                <Trash2 className="mr-1" size={16} />
              )}
              Eliminar
            </button>
          );
        },
        size: 120,
      },
    ],
    [categorias, transacciones, deleteCategoriaMutation.isPending]
  );

  // Configuración de la tabla
  const table = useReactTable({
    data: categorias,
    columns,
    state: { globalFilter },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row: any, columnId: any, filterValue: any) => {
      return String(row.getValue(columnId)).toLowerCase().includes(filterValue.toLowerCase());
    },
  });

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Cargando categorías...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-semibold">Error al cargar categorías</p>
            <p className="text-sm mt-1">{(error as Error).message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

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
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Nombre de la categoría"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={createCategoriaMutation.isPending}
          />
          <button
            onClick={handleAdd}
            disabled={createCategoriaMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createCategoriaMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Guardando...
              </>
            ) : (
              <>
                <Plus size={18} />
                Agregar Categoría
              </>
            )}
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
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    No hay categorías registradas. Agrega una nueva categoría arriba.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        {table.getPageCount() > 1 && (
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
        )}
      </div>
    </MainLayout>
  );
}
