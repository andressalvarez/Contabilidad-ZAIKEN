import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HourDebtService, {
  CreateDebtDto,
  UpdateDebtDto,
  DebtFilters,
  HourDebt,
  BusinessStats,
  MonthlyDebtReviewResponse,
} from '@/services/hourDebt.service';
import { toast } from 'sonner';

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

/**
 * Request monthly debt review (admin)
 */
export function useRequestMonthlyDebtReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<MonthlyDebtReviewResponse> =>
      HourDebtService.requestMonthlyReview(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hour-debt'] });
      toast.success(
        `Revision completada: ${HourDebtService.minutesToHoursString(data.autoAppliedMinutes)} aplicadas, ${data.usersWithGaps} usuarios con diferencia`,
      );
    },
    
  });
}

/**
 * ROBUST CORRECTOR: Delete all deductions and recalculate from scratch (admin)
 */
export function useCorrectMonthlyDeductions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => HourDebtService.correctMonthlyDeductions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hour-debt'] });
    },
  });
}
