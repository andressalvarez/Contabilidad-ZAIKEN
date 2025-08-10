'use client';

import { useState } from 'react';
import { useTiposTransaccion, useCreateTipoTransaccion, useUpdateTipoTransaccion, useDeleteTipoTransaccion } from '@/hooks/useTiposTransaccion';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X, Building2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

export default function TiposTransaccionPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });

  const { data: tiposTransaccion = [], isLoading, refetch } = useTiposTransaccion();
  const createTipoTransaccion = useCreateTipoTransaccion();
  const updateTipoTransaccion = useUpdateTipoTransaccion();
  const deleteTipoTransaccion = useDeleteTipoTransaccion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      if (editingId) {
        await updateTipoTransaccion.mutateAsync({
          id: editingId,
          data: formData
        });
        toast.success('Tipo de transacción actualizado exitosamente');
      } else {
        await createTipoTransaccion.mutateAsync(formData);
        toast.success('Tipo de transacción creado exitosamente');
      }

      resetForm();
      refetch();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el tipo de transacción');
    }
  };

  const handleEdit = (tipo: any) => {
    setEditingId(tipo.id);
    setFormData({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      activo: tipo.activo
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tipo de transacción?')) {
      return;
    }

    try {
      await deleteTipoTransaccion.mutateAsync(id);
      toast.success('Tipo de transacción eliminado exitosamente');
      refetch();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el tipo de transacción');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      activo: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Tipos de Transacción</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Tipo
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {editingId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId ? 'Editar Tipo de Transacción' : 'Nuevo Tipo de Transacción'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: INGRESO, GASTO, APORTE"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.activo.toString()}
                    onChange={(e) => setFormData({...formData, activo: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del tipo de transacción"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                  disabled={createTipoTransaccion.isPending || updateTipoTransaccion.isPending}
                >
                  <Save size={16} />
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
                >
                  <X size={16} />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tipos de Transacción</h3>
          </div>

          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando tipos de transacción...</p>
            </div>
          ) : (
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
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tiposTransaccion.map((tipo) => (
                    <tr key={tipo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tipo.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tipo.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {tipo.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tipo.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tipo.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(tipo.createdAt).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(tipo)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(tipo.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                            disabled={deleteTipoTransaccion.isPending}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
