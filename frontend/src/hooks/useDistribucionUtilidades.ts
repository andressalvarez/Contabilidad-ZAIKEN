import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DistribucionUtilidadesService, CreateDistribucionUtilidadesDto, UpdateDistribucionUtilidadesDto } from '@/services/distribucion-utilidades.service';
import { DistribucionUtilidades, DistribucionDetalle } from '@/types';
import { toast } from 'sonner';

// Query keys
const DISTRIBUCION_KEYS = {
  all: ['distribuciones'] as const,
  lists: () => [...DISTRIBUCION_KEYS.all, 'list'] as const,
  list: (filters: any) => [...DISTRIBUCION_KEYS.lists(), { filters }] as const,
  details: () => [...DISTRIBUCION_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...DISTRIBUCION_KEYS.details(), id] as const,
  stats: () => [...DISTRIBUCION_KEYS.all, 'stats'] as const,
  detalles: (distribucionId: number) => [...DISTRIBUCION_KEYS.all, 'detalles', distribucionId] as const,
};

// Hook para obtener todas las distribuciones
export const useDistribuciones = () => {
  return useQuery({
    queryKey: DISTRIBUCION_KEYS.lists(),
    queryFn: () => DistribucionUtilidadesService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener una distribución por ID
export const useDistribucion = (id: number) => {
  return useQuery({
    queryKey: DISTRIBUCION_KEYS.detail(id),
    queryFn: () => DistribucionUtilidadesService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener estadísticas
export const useDistribucionStats = () => {
  return useQuery({
    queryKey: DISTRIBUCION_KEYS.stats(),
    queryFn: () => DistribucionUtilidadesService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para obtener detalles de una distribución
export const useDistribucionDetalles = (distribucionId: number) => {
  return useQuery({
    queryKey: DISTRIBUCION_KEYS.detalles(distribucionId),
    queryFn: () => DistribucionUtilidadesService.getDetalles(distribucionId),
    enabled: !!distribucionId,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook para crear distribución
export const useCreateDistribucion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDistribucionUtilidadesDto) =>
      DistribucionUtilidadesService.create(data),
    onSuccess: (newDistribucion) => {
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.stats() });
      toast.success('Distribución creada exitosamente');
    },
    onError: (error: any) => {
      console.error('Error creating distribucion:', error);
      toast.error(error.message || 'Error al crear la distribución');
    },
  });
};

// Hook para actualizar distribución
export const useUpdateDistribucion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDistribucionUtilidadesDto }) =>
      DistribucionUtilidadesService.update(id, data),
    onSuccess: (updatedDistribucion) => {
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.detail(updatedDistribucion.id) });
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.stats() });
      toast.success('Distribución actualizada exitosamente');
    },
    onError: (error: any) => {
      console.error('Error updating distribucion:', error);
      toast.error(error.message || 'Error al actualizar la distribución');
    },
  });
};

// Hook para eliminar distribución
export const useDeleteDistribucion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => DistribucionUtilidadesService.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.stats() });
      queryClient.removeQueries({ queryKey: DISTRIBUCION_KEYS.detail(deletedId) });
      toast.success('Distribución eliminada exitosamente');
    },
    onError: (error: any) => {
      console.error('Error deleting distribucion:', error);
      toast.error(error.message || 'Error al eliminar la distribución');
    },
  });
};

// Hook para distribuir automáticamente
export const useDistribuirAutomaticamente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (distribucionId: number) =>
      DistribucionUtilidadesService.distribuirAutomaticamente(distribucionId),
    onSuccess: (_, distribucionId) => {
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.detail(distribucionId) });
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.detalles(distribucionId) });
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.stats() });
      toast.success('Utilidades distribuidas automáticamente');
    },
    onError: (error: any) => {
      console.error('Error distribuyendo automáticamente:', error);
      toast.error(error.message || 'Error al distribuir automáticamente');
    },
  });
};

// Hook para crear detalle de distribución
export const useCreateDistribucionDetalle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => DistribucionUtilidadesService.createDetalle(data),
    onSuccess: (newDetalle) => {
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.detalles(newDetalle.distribucionId) });
      toast.success('Detalle de distribución creado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error creating distribucion detalle:', error);
      toast.error(error.message || 'Error al crear el detalle de distribución');
    },
  });
};

// Hook para actualizar detalle de distribución
export const useUpdateDistribucionDetalle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      DistribucionUtilidadesService.updateDetalle(id, data),
    onSuccess: (updatedDetalle) => {
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.detalles(updatedDetalle.distribucionId) });
      toast.success('Detalle de distribución actualizado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error updating distribucion detalle:', error);
      toast.error(error.message || 'Error al actualizar el detalle de distribución');
    },
  });
};

// Hook para eliminar detalle de distribución
export const useDeleteDistribucionDetalle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => DistribucionUtilidadesService.deleteDetalle(id),
    onSuccess: (_, deletedId) => {
      // Necesitamos invalidar todas las consultas de detalles ya que no tenemos el distribucionId
      queryClient.invalidateQueries({ queryKey: DISTRIBUCION_KEYS.all });
      toast.success('Detalle de distribución eliminado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error deleting distribucion detalle:', error);
      toast.error(error.message || 'Error al eliminar el detalle de distribución');
    },
  });
};
