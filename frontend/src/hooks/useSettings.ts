import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SettingsService, { SmtpConfig } from '@/services/settings.service';
import { toast } from 'sonner';

export function useSmtpConfig() {
  return useQuery({
    queryKey: ['smtp-config'],
    queryFn: () => SettingsService.getSmtpConfig(),
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

export function useUpdateSmtpConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: SmtpConfig) =>
      SettingsService.updateSmtpConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-config'] });
      toast.success('Configuración SMTP actualizada correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al actualizar configuración';
      toast.error(message);
    },
  });
}

export function useTestSmtpConnection() {
  return useMutation({
    mutationFn: (config: SmtpConfig) =>
      SettingsService.testSmtpConnection(config),
    onSuccess: (success) => {
      if (success) {
        toast.success('Conexión SMTP exitosa');
      } else {
        toast.error('Error en la conexión SMTP');
      }
    },
    onError: () => {
      toast.error('Error al probar la conexión');
    },
  });
}
