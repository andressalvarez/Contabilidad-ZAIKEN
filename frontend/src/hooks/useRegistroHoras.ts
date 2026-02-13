import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RegistroHorasService } from '@/services/registro-horas.service';
import { CreateRegistroHorasDto, UpdateRegistroHorasDto } from '@/types';
import { toast } from 'sonner';

// Query keys
export const timeRecordKeys = {
  all: ['timeRecords'] as const,
  lists: () => [...timeRecordKeys.all, 'list'] as const,
  list: (filters: string) => [...timeRecordKeys.lists(), { filters }] as const,
  details: () => [...timeRecordKeys.all, 'detail'] as const,
  detail: (id: number) => [...timeRecordKeys.details(), id] as const,
  byUser: (userId: number) => [...timeRecordKeys.all, 'user', userId] as const,
  stats: () => [...timeRecordKeys.all, 'stats'] as const,
};

// Legacy export for backward compatibility
export const registroHorasKeys = timeRecordKeys;

// Hook to get all time records
export function useRegistroHoras() {
  return useQuery({
    queryKey: timeRecordKeys.list('all'),
    queryFn: () => RegistroHorasService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRegistroHorasByUsuario(userId: number) {
  return useQuery({
    queryKey: timeRecordKeys.byUser(userId),
    queryFn: () => RegistroHorasService.getByUsuarioId(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to get a specific time record
export function useRegistroHorasById(id: number) {
  return useQuery({
    queryKey: timeRecordKeys.detail(id),
    queryFn: () => RegistroHorasService.getById(id),
    enabled: !!id,
  });
}

// Hook to get statistics
export function useRegistroHorasStats() {
  return useQuery({
    queryKey: timeRecordKeys.stats(),
    queryFn: () => RegistroHorasService.getStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook to create a time record
export function useCreateRegistroHoras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRegistroHorasDto) => RegistroHorasService.create(data),
    onSuccess: (newRecord) => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.stats() });

      // Optimistically update cache
      queryClient.setQueryData(timeRecordKeys.detail(newRecord.id), newRecord);

      toast.success('Registro de horas creado exitosamente');
    },
    
  });
}

// Hook to update a time record
export function useUpdateRegistroHoras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRegistroHorasDto }) =>
      RegistroHorasService.update(id, data),
    onSuccess: (updatedRecord) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.stats() });
      queryClient.setQueryData(timeRecordKeys.detail(updatedRecord.id), updatedRecord);

      toast.success('Registro de horas actualizado exitosamente');
    },
    
  });
}

// Hook to delete a time record
export function useDeleteRegistroHoras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => RegistroHorasService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.stats() });

      // Remove specific record from cache
      queryClient.removeQueries({ queryKey: timeRecordKeys.detail(deletedId) });

      toast.success('Registro de horas eliminado exitosamente');
    },
    
  });
}

// ==================== TIMER HOOKS ====================

// Hook to get active timer for a user
export function useActiveTimer(userId: number) {
  return useQuery({
    queryKey: [...timeRecordKeys.all, 'activeTimer', userId],
    queryFn: () => RegistroHorasService.getActiveTimerByUsuario(userId),
    enabled: !!userId,
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: 1000 * 10, // Refetch every 10 seconds
  });
}

// Hook to start timer
export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { usuarioId?: number; campanaId?: number; descripcion?: string }) =>
      RegistroHorasService.startTimer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.stats() });
      queryClient.invalidateQueries({ queryKey: [...timeRecordKeys.all, 'activeTimer'] });
      toast.success('⏱️ Timer iniciado');
    },
    
  });
}

// Hook to pause timer
export function usePauseTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => RegistroHorasService.pauseTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...timeRecordKeys.all, 'activeTimer'] });
      toast.success('⏸️ Timer pausado');
    },
    
  });
}

// Hook to resume timer
export function useResumeTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => RegistroHorasService.resumeTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...timeRecordKeys.all, 'activeTimer'] });
      toast.success('▶️ Timer reanudado');
    },
    
  });
}

// Hook to stop timer
export function useStopTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, descripcion }: { id: number; descripcion?: string }) =>
      RegistroHorasService.stopTimer(id, descripcion),
    onSuccess: (stoppedTimer) => {
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.stats() });
      queryClient.invalidateQueries({ queryKey: [...timeRecordKeys.all, 'activeTimer'] });
      toast.success(`⏹️ Timer detenido - ${stoppedTimer.horas?.toFixed(2) || 0}h registradas`);
    },
    
  });
}

// Hook to cancel timer
export function useCancelTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => RegistroHorasService.cancelTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...timeRecordKeys.all, 'activeTimer'] });
      toast.success('Timer cancelado');
    },
    
  });
}

// ==================== TIME EDITING HOOKS ====================

// Hook to update timer times (start/end)
export function useUpdateTimerTimes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, timerInicio, timerFin }: { id: number; timerInicio?: string; timerFin?: string }) =>
      RegistroHorasService.updateTimerTimes(id, timerInicio, timerFin),
    onSuccess: (updatedRecord) => {
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.stats() });
      queryClient.setQueryData(timeRecordKeys.detail(updatedRecord.id), updatedRecord);
      toast.success(`Tiempos actualizados - ${updatedRecord.horas?.toFixed(2) || 0}h`);
    },
    
  });
}

// Hook to resubmit a rejected record
export function useResubmitRegistro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => RegistroHorasService.resubmit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...timeRecordKeys.all, 'pending'] });
      queryClient.invalidateQueries({ queryKey: [...timeRecordKeys.all, 'rejected'] });
      toast.success('Registro re-enviado para revisión');
    },
    
  });
}

// Hook to get orphaned timers
export function useOrphanedTimers() {
  return useQuery({
    queryKey: [...timeRecordKeys.all, 'orphaned'],
    queryFn: () => RegistroHorasService.getOrphanedTimers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to force close an orphaned timer
export function useForceCloseTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => RegistroHorasService.forceCloseTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...timeRecordKeys.all, 'orphaned'] });
      queryClient.invalidateQueries({ queryKey: [...timeRecordKeys.all, 'activeTimer'] });
      toast.success('Timer cerrado forzadamente');
    },
    
  });
}
