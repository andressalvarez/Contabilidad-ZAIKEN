import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ValorHoraService } from '@/services/valor-hora.service';
import { CreateValorHoraDto, UpdateValorHoraDto } from '@/types';
import { toast } from 'react-hot-toast';

// Query keys
export const valorHoraKeys = {
  all: ['valorHora'] as const,
  lists: () => [...valorHoraKeys.all, 'list'] as const,
  list: (filters: string) => [...valorHoraKeys.lists(), { filters }] as const,
  details: () => [...valorHoraKeys.all, 'detail'] as const,
  detail: (id: number) => [...valorHoraKeys.details(), id] as const,
  byUsuario: (usuarioId: number) => [...valorHoraKeys.all, 'usuario', usuarioId] as const,
  stats: () => [...valorHoraKeys.all, 'stats'] as const,
};

// Hook para obtener todos los valores por hora
export function useValorHora() {
  return useQuery({
    queryKey: valorHoraKeys.list('all'),
    queryFn: () => ValorHoraService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ✅ Hook para obtener valores por hora de un usuario
export function useValorHoraByUsuario(usuarioId: number) {
  return useQuery({
    queryKey: valorHoraKeys.byUsuario(usuarioId),
    queryFn: () => ValorHoraService.getByUsuarioId(usuarioId),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to get a specific hour value
export function useValorHoraById(id: number) {
  return useQuery({
    queryKey: valorHoraKeys.detail(id),
    queryFn: () => ValorHoraService.getById(id),
    enabled: !!id,
  });
}

// Hook to get statistics
export function useValorHoraStats() {
  return useQuery({
    queryKey: valorHoraKeys.stats(),
    queryFn: () => ValorHoraService.getStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook to create an hour value
export function useCreateValorHora() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateValorHoraDto) => ValorHoraService.create(data),
    onSuccess: (newValorHora) => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: valorHoraKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valorHoraKeys.stats() });

      // Optimistically update cache
      queryClient.setQueryData(valorHoraKeys.detail(newValorHora.id), newValorHora);

      toast.success('Valor por hora creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el valor por hora');
    },
  });
}

// Hook to update an hour value
export function useUpdateValorHora() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateValorHoraDto }) =>
      ValorHoraService.update(id, data),
    onSuccess: (updatedValorHora) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: valorHoraKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valorHoraKeys.stats() });
      queryClient.setQueryData(valorHoraKeys.detail(updatedValorHora.id), updatedValorHora);

      toast.success('Valor por hora actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el valor por hora');
    },
  });
}

// Hook to delete an hour value
export function useDeleteValorHora() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ValorHoraService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists and statistics
      queryClient.invalidateQueries({ queryKey: valorHoraKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valorHoraKeys.stats() });

      // Remove specific hour value from cache
      queryClient.removeQueries({ queryKey: valorHoraKeys.detail(deletedId) });

      toast.success('Valor por hora eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el valor por hora');
    },
  });
}






