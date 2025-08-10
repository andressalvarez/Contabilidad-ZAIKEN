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
  tendencias: (año?: number, personaId?: number) => [...transaccionesKeys.all, 'tendencias', año, personaId] as const,
};

// Hook para obtener transacciones con filtros
export function useTransacciones(filtros: FiltrosTransacciones = {}) {
  return useQuery({
    queryKey: transaccionesKeys.list(filtros),
    queryFn: () => TransaccionesService.getAll(filtros),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

// Hook para obtener transacciones recientes
export function useTransaccionesRecientes(limit = 10) {
  return useQuery({
    queryKey: transaccionesKeys.recent(limit),
    queryFn: () => TransaccionesService.getRecent(limit),
    staleTime: 1000 * 60 * 1, // 1 minuto
  });
}

// Hook para obtener transacciones pendientes
export function useTransaccionesPendientes() {
  return useQuery({
    queryKey: transaccionesKeys.pending(),
    queryFn: TransaccionesService.getPending,
    staleTime: 1000 * 30, // 30 segundos
  });
}

// Hook para obtener estadísticas
export function useTransaccionesStats(filtros: FiltrosTransacciones = {}) {
  return useQuery({
    queryKey: transaccionesKeys.stats(filtros),
    queryFn: () => TransaccionesService.getStats(filtros),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obtener resumen por categorías
export function useResumenPorCategorias(filtros: { fechaInicio?: string; fechaFin?: string } = {}) {
  return useQuery({
    queryKey: transaccionesKeys.resumenCategorias(filtros),
    queryFn: () => TransaccionesService.getResumenPorCategorias(filtros),
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para obtener tendencias mensuales
export function useTendenciasMensuales(año?: number) {
  return useQuery({
    queryKey: transaccionesKeys.tendencias(año),
    queryFn: () => TransaccionesService.getTendenciasMensuales(año),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// Hook para obtener una transacción específica
export function useTransaccion(id: number) {
  return useQuery({
    queryKey: transaccionesKeys.detail(id),
    queryFn: () => TransaccionesService.getById(id),
    enabled: !!id,
  });
}

// Hook para crear una transacción
export function useCreateTransaccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransaccionDto) => TransaccionesService.create(data),
    onSuccess: (newTransaccion) => {
      // Invalidar todas las consultas relacionadas
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.all });

      toast.success('Transacción creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la transacción');
    },
  });
}

// Hook para actualizar una transacción
export function useUpdateTransaccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransaccionDto }) =>
      TransaccionesService.update(id, data),
    onSuccess: (updatedTransaccion) => {
      // Invalidar queries relacionadas
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

// Hook para aprobar transacción
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

// Hook para rechazar transacción
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

// Hook para eliminar una transacción
export function useDeleteTransaccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => TransaccionesService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidar todas las consultas
      queryClient.invalidateQueries({ queryKey: transaccionesKeys.all });

      // Remover la transacción específica del cache
      queryClient.removeQueries({ queryKey: transaccionesKeys.detail(deletedId) });

      toast.success('Transacción eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la transacción');
    },
  });
}

// Hook para obtener resumen por tipos de gasto
export function useResumenPorTiposGasto(filtros: any = {}) {
  return useQuery({
    queryKey: ['resumen-tipos-gasto', filtros],
    queryFn: () => TransaccionesService.getResumenPorTiposGasto(filtros),
    staleTime: 1000 * 60 * 5,
  });
}
