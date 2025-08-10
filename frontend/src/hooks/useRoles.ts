import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RolesService } from '@/services';
import { CreateRolDto, UpdateRolDto } from '@/types';
import { toast } from 'react-hot-toast';

// Query keys
export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (filters: string) => [...rolesKeys.lists(), { filters }] as const,
  details: () => [...rolesKeys.all, 'detail'] as const,
  detail: (id: number) => [...rolesKeys.details(), id] as const,
  stats: (id: number) => [...rolesKeys.detail(id), 'stats'] as const,
};

// Hook para obtener todos los roles
export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.lists(),
    queryFn: RolesService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obtener roles activos
export function useActiveRoles() {
  return useQuery({
    queryKey: rolesKeys.list('active'),
    queryFn: RolesService.getActive,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para obtener un rol específico
export function useRol(id: number) {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: () => RolesService.getById(id),
    enabled: !!id,
  });
}

// Hook para obtener estadísticas de un rol
export function useRolStats(id: number) {
  return useQuery({
    queryKey: rolesKeys.stats(id),
    queryFn: () => RolesService.getStats(id),
    enabled: !!id,
  });
}

// Hook para crear un rol
export function useCreateRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRolDto) => RolesService.create(data),
    onSuccess: (newRol) => {
      // Invalidar y refetch las listas de roles
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });

      // Optimistamente actualizar el cache
      queryClient.setQueryData(rolesKeys.detail(newRol.id), newRol);

      toast.success('Rol creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el rol');
    },
  });
}

// Hook para actualizar un rol
export function useUpdateRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRolDto }) =>
      RolesService.update(id, data),
    onSuccess: (updatedRol) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.setQueryData(rolesKeys.detail(updatedRol.id), updatedRol);

      toast.success('Rol actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el rol');
    },
  });
}

// Hook para eliminar un rol
export function useDeleteRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => RolesService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });

      // Remover el rol específico del cache
      queryClient.removeQueries({ queryKey: rolesKeys.detail(deletedId) });

      toast.success('Rol eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el rol');
    },
  });
}
