import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RolesService } from '@/services';
import { CreateRolDto, UpdateRolDto } from '@/types';
import { toast } from 'sonner';

// Query keys
export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (filters: string) => [...rolesKeys.lists(), { filters }] as const,
  details: () => [...rolesKeys.all, 'detail'] as const,
  detail: (id: number) => [...rolesKeys.details(), id] as const,
  stats: (id: number) => [...rolesKeys.detail(id), 'stats'] as const,
};

// Hook to get all roles
export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.lists(),
    queryFn: RolesService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to get active roles
export function useActiveRoles() {
  return useQuery({
    queryKey: rolesKeys.list('active'),
    queryFn: RolesService.getActive,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to get a specific role
export function useRol(id: number) {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: () => RolesService.getById(id),
    enabled: !!id,
  });
}

// Hook to get role statistics
export function useRolStats(id: number) {
  return useQuery({
    queryKey: rolesKeys.stats(id),
    queryFn: () => RolesService.getStats(id),
    enabled: !!id,
  });
}

// Hook to create a role
export function useCreateRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRolDto) => RolesService.create(data),
    onSuccess: (newRol) => {
      // Invalidate and refetch role lists
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });

      // Optimistically update cache
      queryClient.setQueryData(rolesKeys.detail(newRol.id), newRol);

      toast.success('Rol creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el rol');
    },
  });
}

// Hook to update a role
export function useUpdateRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRolDto }) =>
      RolesService.update(id, data),
    onSuccess: (updatedRol) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.setQueryData(rolesKeys.detail(updatedRol.id), updatedRol);

      toast.success('Rol actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el rol');
    },
  });
}

// Hook to delete a role
export function useDeleteRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => RolesService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });

      // Remove specific role from cache
      queryClient.removeQueries({ queryKey: rolesKeys.detail(deletedId) });

      toast.success('Rol eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el rol');
    },
  });
}
