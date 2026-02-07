import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HourDebtService, {
  CreateDebtDto,
  UpdateDebtDto,
  DebtFilters,
  HourDebt,
  BusinessStats,
} from '@/services/hourDebt.service';
import { toast } from 'react-hot-toast';

// ==========================
// USER HOOKS
// ==========================

/**
 * Get own debt balance
 */
export function useMyBalance() {
  return useQuery({
    queryKey: ['hour-debt', 'my-balance'],
    queryFn: () => HourDebtService.getMyBalance(),
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

/**
 * Get own debt history
 */
export function useMyHistory() {
  return useQuery({
    queryKey: ['hour-debt', 'my-history'],
    queryFn: () => HourDebtService.getMyHistory(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

/**
 * Create own debt
 */
export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDebtDto) => HourDebtService.createDebt(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hour-debt'] });
      toast.success('Deuda registrada correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al crear deuda';
      toast.error(message);
    },
  });
}

// ==========================
// ADMIN HOOKS
// ==========================

/**
 * Get all debts (admin)
 */
export function useAllDebts(filters?: DebtFilters) {
  return useQuery({
    queryKey: ['hour-debt', 'all', filters],
    queryFn: () => HourDebtService.getAllDebts(filters),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

/**
 * Get debts by usuario (admin)
 */
export function useUserDebts(usuarioId: number | undefined) {
  return useQuery({
    queryKey: ['hour-debt', 'usuario', usuarioId],
    queryFn: () => HourDebtService.getUserDebts(usuarioId!),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get specific debt
 */
export function useDebt(id: number | undefined) {
  return useQuery({
    queryKey: ['hour-debt', id],
    queryFn: () => HourDebtService.getDebt(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Update debt (admin)
 */
export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateDebtDto }) =>
      HourDebtService.updateDebt(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hour-debt'] });
      toast.success('Deuda actualizada correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al actualizar deuda';
      toast.error(message);
    },
  });
}

/**
 * Delete debt (admin)
 */
export function useDeleteDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => HourDebtService.deleteDebt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hour-debt'] });
      toast.success('Deuda eliminada correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al eliminar deuda';
      toast.error(message);
    },
  });
}

/**
 * Cancel debt (admin)
 */
export function useCancelDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      HourDebtService.cancelDebt(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hour-debt'] });
      toast.success('Deuda cancelada correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al cancelar deuda';
      toast.error(message);
    },
  });
}

/**
 * Get deduction history
 */
export function useDeductionHistory(debtId: number | undefined) {
  return useQuery({
    queryKey: ['hour-debt', debtId, 'deductions'],
    queryFn: () => HourDebtService.getDeductionHistory(debtId!),
    enabled: !!debtId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get audit log (admin)
 */
export function useAuditLog(debtId: number | undefined) {
  return useQuery({
    queryKey: ['hour-debt', debtId, 'audit-log'],
    queryFn: () => HourDebtService.getAuditLog(debtId!),
    enabled: !!debtId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Get business statistics (admin)
 */
export function useBusinessStats() {
  return useQuery({
    queryKey: ['hour-debt', 'stats', 'business'],
    queryFn: () => HourDebtService.getBusinessStats(),
    staleTime: 1000 * 60 * 5,
  });
}
