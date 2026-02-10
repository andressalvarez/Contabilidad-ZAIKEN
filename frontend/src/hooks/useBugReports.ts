import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import BugReportsService, {
  BugReportListQuery,
  BugReportStatus,
  CreateBugReportDto,
} from '@/services/bug-reports.service';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useCreateBugReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBugReportDto) => BugReportsService.createBugReport(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      toast.success('Reporte enviado. Gracias por el feedback.');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo enviar el reporte'));
    },
  });
}

export function useBugReports(query?: BugReportListQuery) {
  return useQuery({
    queryKey: ['bug-reports', query],
    queryFn: () => BugReportsService.getBugReports(query),
  });
}

export function useUpdateBugReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: BugReportStatus }) =>
      BugReportsService.updateBugReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      toast.success('Estado del reporte actualizado');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo actualizar el estado'));
    },
  });
}
