import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SettingsService, { SmtpConfig } from '@/services/settings.service';
import { toast } from 'sonner';
import type { NavigationLayout } from '@/types/navigation';

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

export function useNavigationLayout() {
  return useQuery({
    queryKey: ['navigation-layout'],
    queryFn: () => SettingsService.getNavigationLayout(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateNavigationLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (layout: NavigationLayout) =>
      SettingsService.updateNavigationLayout(layout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-layout'] });
      toast.success('Navegacion actualizada correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al actualizar navegacion';
      toast.error(message);
    },
  });
}

export function useResetNavigationLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => SettingsService.resetNavigationLayout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-layout'] });
      toast.success('Navegacion restaurada al estado base');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al restaurar navegacion';
      toast.error(message);
    },
  });
}
