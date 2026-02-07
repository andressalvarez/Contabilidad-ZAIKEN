import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransaccionesService } from '@/services';
import type {
  FiltrosTransacciones,
  EstadisticasTransacciones,
  ResumenPorCategoria,
  TendenciaMensual
} from '@/services/transacciones.service';
import { CreateTransaccionDto, UpdateTransaccionDto } from '@/types';
import { toast } from 'react-hot-toast';

// Query keys
export const transaccionesKeys = {
  all: ['transacciones'] as const,
  lists: () => [...transaccionesKeys.all, 'list'] as const,
  list: (filtros: FiltrosTransacciones) => [...transaccionesKeys.lists(), { filtros }] as const,
  details: () => [...transaccionesKeys.all, 'detail'] as const,
  detail: (id: number) => [...transaccionesKeys.details(), id] as const,
  stats: (filtros: FiltrosTransacciones) => [...transaccionesKeys.all, 'stats', { filtros }] as const,
  recent: (limit: number) => [...transaccionesKeys.all, 'recent', limit] as const,
  pending: () => [...transaccionesKeys.all, 'pending'] as const,
  resumenCategorias: (filtros: { fechaInicio?: string; fechaFin?: string }) =>
    [...transaccionesKeys.all, 'resumen-categorias', { filtros }] as const,
  tendencias: (año?: number) => [...transaccionesKeys.all, 'tendencias', año] as const,
};

// Hook to get transactions with filters
export function useTransacciones(filtros: FiltrosTransacciones = {}) {
  return useQuery({
    queryKey: transaccionesKeys.list(filtros),
    queryFn: () => TransaccionesService.getAll(filtros),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Hook to get recent transactions
export function useTransaccionesRecientes(limit = 10) {
  return useQuery({
    queryKey: transaccionesKeys.recent(limit),
    queryFn: () => TransaccionesService.getRecent(limit),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

// Hook to get pending transactions
export function useTransaccionesPendientes() {
  return useQuery({
    queryKey: transaccionesKeys.pending(),
    queryFn: TransaccionesService.getPending,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook to get statistics
export function useTransaccionesStats(filtros: FiltrosTransacciones = {}) {
  return useQuery({
    queryKey: transaccionesKeys.stats(filtros),
    queryFn: () => TransaccionesService.getStats(filtros),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to get summary by categories
export function useResumenPorCategorias(filtros: { fechaInicio?: string; fechaFin?: string } = {}) {
  return useQuery({
    queryKey: transaccionesKeys.resumenCategorias(filtros),
    queryFn: () => TransaccionesService.getResumenPorCategorias(filtros),
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to get monthly trends
export function useTendenciasMensuales(año?: number) {
  return useQuery({
    queryKey: transaccionesKeys.tendencias(año),
    queryFn: () => TransaccionesService.getTendenciasMensuales(año),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook to get a specific transaction
export function useTransaccion(id: number) {
  return useQuery({
    queryKey: transaccionesKeys.detail(id),
    queryFn: () => TransaccionesService.getById(id),
    enabled: !!id,
  });
}

// Hook to create a transaction
export function useCreateTransaccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransaccionDto) => TransaccionesService.create(data),
    retry: 2,
    retryDelay: 1000,
    onSuccess: (newTransaccion) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.all });

      toast.success('Transacción creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la transacción');
    },
  });
}

// Hook to update a transaction
export function useUpdateTransaccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransaccionDto }) =>
      TransaccionesService.update(id, data),
    retry: 2,
    retryDelay: 1000,
    onSuccess: (updatedTransaccion) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.all });
      queryClient.setQueryData(transaccionesKeys.detail(updatedTransaccion.id), updatedTransaccion);

      toast.success('Transacción actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la transacción');
    },
  });
}

// Hook to approve a transaction
export function useApproveTransaccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => TransaccionesService.approve(id),
    onSuccess: (approvedTransaccion) => {
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.all });
      queryClient.setQueryData(transaccionesKeys.detail(approvedTransaccion.id), approvedTransaccion);

      toast.success('Transacción aprobada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al aprobar la transacción');
    },
  });
}

// Hook to reject a transaction
export function useRejectTransaccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => TransaccionesService.reject(id),
    onSuccess: (rejectedTransaccion) => {
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.all });
      queryClient.setQueryData(transaccionesKeys.detail(rejectedTransaccion.id), rejectedTransaccion);

      toast.success('Transacción rechazada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al rechazar la transacción');
    },
  });
}

// Hook to delete a transaction
export function useDeleteTransaccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => TransaccionesService.delete(id),
    retry: 2,
    retryDelay: 1000,
    onSuccess: (_, deletedId) => {
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.all });

      // Remove specific transaction from cache
      queryClient.removeQueries({ queryKey: transaccionesKeys.detail(deletedId) });

      toast.success('Transacción eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la transacción');
    },
  });
}

// Hook to get summary by expense types
export function useResumenPorTiposGasto(filtros: any = {}) {
  return useQuery({
    queryKey: ['resumen-tipos-gasto', filtros],
    queryFn: () => TransaccionesService.getResumenPorTiposGasto(filtros),
    staleTime: 1000 * 60 * 5,
  });
}
