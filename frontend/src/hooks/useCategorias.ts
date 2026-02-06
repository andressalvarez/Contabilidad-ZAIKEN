import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoriasService } from '@/services';
import type { CreateCategoriaDto, UpdateCategoriaDto } from '@/services/categorias.service';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errors';

// Query keys
export const categoriasKeys = {
  all: ['categorias'] as const,
  lists: () => [...categoriasKeys.all, 'list'] as const,
  details: () => [...categoriasKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoriasKeys.details(), id] as const,
};

// Hook to get all categories
export function useCategorias() {
  return useQuery({
    queryKey: categoriasKeys.lists(),
    queryFn: CategoriasService.getAll,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Hook to get a specific category
export function useCategoria(id: number) {
  return useQuery({
    queryKey: categoriasKeys.detail(id),
    queryFn: () => CategoriasService.getById(id),
    enabled: !!id,
  });
}

// Hook to create a category
export function useCreateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoriaDto) => CategoriasService.create(data),
    retry: 2,
    retryDelay: 1000,
    onSuccess: (newCategoria) => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() });
      queryClient.setQueryData(categoriasKeys.detail(newCategoria.id), newCategoria);

      // Invalidate transactions and statistics since they depend on categories
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });

      toast.success('Categoría creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Hook to update a category
export function useUpdateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoriaDto }) =>
      CategoriasService.update(id, data),
    retry: 2,
    retryDelay: 1000,
    onSuccess: (updatedCategoria) => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() });
      queryClient.setQueryData(categoriasKeys.detail(updatedCategoria.id), updatedCategoria);

      // Invalidate transactions and statistics since they depend on categories
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });

      toast.success('Categoría actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la categoría');
    },
  });
}

// Hook to delete a category
export function useDeleteCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => CategoriasService.delete(id),
    retry: 2,
    retryDelay: 1000,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.lists() });
      queryClient.removeQueries({ queryKey: categoriasKeys.detail(deletedId) });

      // Invalidate transactions and statistics since they depend on categories
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });

      toast.success('Categoría eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la categoría');
    },
  });
}
