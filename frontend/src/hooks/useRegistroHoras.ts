import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RegistroHorasService } from '@/services/registro-horas.service';
import { CreateRegistroHorasDto, UpdateRegistroHorasDto } from '@/types';
import { toast } from 'react-hot-toast';

// Query keys
export const registroHorasKeys = {
  all: ['registroHoras'] as const,
  lists: () => [...registroHorasKeys.all, 'list'] as const,
  list: (filters: string) => [...registroHorasKeys.lists(), { filters }] as const,
  details: () => [...registroHorasKeys.all, 'detail'] as const,
  detail: (id: number) => [...registroHorasKeys.details(), id] as const,
  byUsuario: (usuarioId: number) => [...registroHorasKeys.all, 'usuario', usuarioId] as const,
  stats: () => [...registroHorasKeys.all, 'stats'] as const,
};

// Hook para obtener todos los registros de horas
export function useRegistroHoras() {
  return useQuery({
    queryKey: registroHorasKeys.list('all'),
    queryFn: () => RegistroHorasService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useRegistroHorasByUsuario(usuarioId: number) {
  return useQuery({
    queryKey: registroHorasKeys.byUsuario(usuarioId),
    queryFn: () => RegistroHorasService.getByUsuarioId(usuarioId),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para obtener un registro de horas específico
export function useRegistroHorasById(id: number) {
  return useQuery({
    queryKey: registroHorasKeys.detail(id),
    queryFn: () => RegistroHorasService.getById(id),
    enabled: !!id,
  });
}

// Hook para obtener estadísticas
export function useRegistroHorasStats() {
  return useQuery({
    queryKey: registroHorasKeys.stats(),
    queryFn: () => RegistroHorasService.getStats(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

// Hook para crear un registro de horas
export function useCreateRegistroHoras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRegistroHorasDto) => RegistroHorasService.create(data),
    onSuccess: (newRegistroHoras) => {
      // Invalidar y refetch las listas
      queryClient.invalidateQueries({ queryKey: registroHorasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: registroHorasKeys.stats() });

      // Optimistamente actualizar el cache
      queryClient.setQueryData(registroHorasKeys.detail(newRegistroHoras.id), newRegistroHoras);

      toast.success('Registro de horas creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el registro de horas');
    },
  });
}

// Hook para actualizar un registro de horas
export function useUpdateRegistroHoras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRegistroHorasDto }) =>
      RegistroHorasService.update(id, data),
    onSuccess: (updatedRegistroHoras) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: registroHorasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: registroHorasKeys.stats() });
      queryClient.setQueryData(registroHorasKeys.detail(updatedRegistroHoras.id), updatedRegistroHoras);

      toast.success('Registro de horas actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el registro de horas');
    },
  });
}

// Hook para eliminar un registro de horas
export function useDeleteRegistroHoras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => RegistroHorasService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidar listas y estadísticas
      queryClient.invalidateQueries({ queryKey: registroHorasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: registroHorasKeys.stats() });

      // Remover el registro de horas específico del cache
      queryClient.removeQueries({ queryKey: registroHorasKeys.detail(deletedId) });

      toast.success('Registro de horas eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el registro de horas');
    },
  });
}






