'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  User,
  Mail,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  UserCog,
  Briefcase,
  TrendingUp,
  DollarSign,
  FileText,
  Percent,
  Send,
  Loader2
} from 'lucide-react';
import { useUsuarios } from '@/hooks/useUsuarios';
import { UsuariosService } from '@/services/usuarios.service';
import { RolesService } from '@/services/roles.service';
import { Usuario, Rol, CreateUsuarioDto } from '@/types';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ScrollableTable } from '@/components/ui/ScrollableTable';

interface FormData {
  nombre: string;
  email: string;
  rol: 'ADMIN_NEGOCIO' | 'USER' | 'EMPLEADO';
  password: string;
  activo: boolean;
  rolId?: number;
  participacionPorc?: number;
  valorHora?: number;
  notas?: string;
}

export default function UsuariosPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    rol: 'USER',
    password: '',
    activo: true,
    rolId: undefined,
    participacionPorc: 0,
    valorHora: 0,
    notas: '',
  });

  const queryClient = useQueryClient();
  const { data: usuarios = [], isLoading, error } = useUsuarios();

  // ✅ Cargar roles para el selector
  const { data: roles = [] } = useQuery<Rol[]>({
    queryKey: ['roles'],
    queryFn: () => RolesService.getActive(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDto) => UsuariosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario creado exitosamente');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      UsuariosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario actualizado exitosamente');
      setEditingUsuario(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar usuario');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => UsuariosService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar usuario');
    },
  });

  const sendPasswordResetMutation = useMutation({
    mutationFn: (userId: number) => UsuariosService.sendPasswordReset(userId),
    onSuccess: (data) => {
      toast.success(data.message || 'Correo de recuperación enviado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al enviar correo de recuperación');
    },
  });

  const handleSendPasswordReset = async (usuario: Usuario) => {
    if (confirm(`¿Enviar correo de recuperación de contraseña a ${usuario.email}?`)) {
      await sendPasswordResetMutation.mutateAsync(usuario.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Participation validation
    if (formData.participacionPorc && formData.participacionPorc > 100) {
      toast.error('La participación no puede ser mayor a 100%');
      return;
    }

    if (editingUsuario) {
      const updateData: Partial<CreateUsuarioDto> = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        activo: formData.activo,
        rolId: formData.rolId,
        participacionPorc: formData.participacionPorc,
        valorHora: formData.valorHora,
        notas: formData.notas,
      };

      // Only include password if changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateMutation.mutateAsync({ id: editingUsuario.id, data: updateData });
    } else {
      if (!formData.password) {
        toast.error('La contraseña es obligatoria para nuevos usuarios');
        return;
      }
      await createMutation.mutateAsync(formData as CreateUsuarioDto);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      password: '', // No pre-llenar password por seguridad
      activo: usuario.activo,
      rolId: usuario.rolId,
      participacionPorc: usuario.participacionPorc || 0,
      valorHora: usuario.valorHora || 0,
      notas: usuario.notas || '',
    });
    setEditingUsuario(usuario);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      rol: 'USER',
      password: '',
      activo: true,
      rolId: undefined,
      participacionPorc: 0,
      valorHora: 0,
      notas: '',
    });
    setEditingUsuario(null);
    setIsCreateModalOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="text-indigo-600 h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-gray-600 text-xs sm:text-sm">Administra los usuarios del sistema</p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm text-sm sm:text-base min-h-[44px] w-full sm:w-auto sm:self-start"
            >
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Error cargando usuarios: {(error as Error).message}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando usuarios...</p>
          </div>
        )}

        {/* Usuarios Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCog className="text-blue-600 h-5 w-5" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Usuarios del Sistema ({usuarios.length})
                </h2>
              </div>
            </div>

            {usuarios.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">Comienza agregando tu primer usuario</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base min-h-[44px]"
                >
                  Agregar Primer Usuario
                </button>
              </div>
            ) : (
              <ScrollableTable>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Rol Sistema
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Rol Negocio
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participación
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Valor/Hora
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className={`hover:bg-gray-50 ${!usuario.activo ? 'opacity-60' : ''}`}>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-full">
                              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" />
                            </div>
                            <div className="font-medium text-gray-900 text-sm">{usuario.nombre}</div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate max-w-[120px] sm:max-w-none">{usuario.email}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            usuario.rol === 'ADMIN_NEGOCIO'
                              ? 'bg-purple-100 text-purple-800'
                              : usuario.rol === 'EMPLEADO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            <Shield className="h-3 w-3" />
                            {usuario.rol === 'ADMIN_NEGOCIO' ? 'ADMIN' : usuario.rol}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {usuario.rolNegocio ? (
                            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              <Briefcase className="h-3 w-3" />
                              {usuario.rolNegocio.nombreRol}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {usuario.participacionPorc > 0 ? (
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-900">
                              <Percent className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                              <span className="font-medium">{usuario.participacionPorc.toFixed(2)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-400">0%</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {usuario.valorHora > 0 ? (
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-900">
                              <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                              <span>${usuario.valorHora.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            usuario.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {usuario.activo ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                <span className="hidden sm:inline">Activo</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                <span className="hidden sm:inline">Inactivo</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                            <button
                              onClick={() => handleSendPasswordReset(usuario)}
                              className="text-amber-600 hover:text-amber-900 p-1.5 hover:bg-amber-50 rounded transition-colors"
                              disabled={sendPasswordResetMutation.isPending}
                              title="Enviar correo de recuperación"
                            >
                              {sendPasswordResetMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(usuario)}
                              className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded transition-colors"
                              title="Editar usuario"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(usuario.id)}
                              className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                              disabled={deleteMutation.isPending}
                              title="Eliminar usuario"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollableTable>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-lg sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                  {editingUsuario ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {editingUsuario ? 'Modifica los datos del usuario' : 'Completa los datos del nuevo usuario'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    <User className="h-4 w-4" />
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm min-h-[44px]"
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    <Mail className="h-4 w-4" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm min-h-[44px]"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Shield className="h-4 w-4" />
                    Rol del Sistema *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'ADMIN_NEGOCIO' | 'USER' | 'EMPLEADO' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="USER">Usuario</option>
                    <option value="EMPLEADO">Empleado</option>
                    <option value="ADMIN_NEGOCIO">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="h-4 w-4" />
                    Rol de Negocio (opcional)
                  </label>
                  <select
                    value={formData.rolId || ''}
                    onChange={(e) => setFormData({ ...formData, rolId: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">-- Sin rol de negocio --</option>
                    {roles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombreRol}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Rol específico dentro del negocio (ej: Desarrollador, Diseñador)</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">%</span> Participación
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.participacionPorc || 0}
                      onChange={(e) => setFormData({ ...formData, participacionPorc: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm min-h-[44px]"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">Para distribución de utilidades</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Valor/Hora
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.valorHora || 0}
                      onChange={(e) => setFormData({ ...formData, valorHora: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm min-h-[44px]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4" />
                    Notas (opcional)
                  </label>
                  <textarea
                    value={formData.notas || ''}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    placeholder="Información adicional sobre el usuario"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Key className="h-4 w-4" />
                    Contraseña {editingUsuario && '(dejar en blanco para no cambiar)'}
                    {!editingUsuario && ' *'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    placeholder="••••••••"
                    required={!editingUsuario}
                  />
                  {!editingUsuario && (
                    <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Usuario activo</span>
                  </label>
                </div>

                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : (editingUsuario ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
