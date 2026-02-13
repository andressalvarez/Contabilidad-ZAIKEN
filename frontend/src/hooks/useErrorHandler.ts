'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { showAlert } from '@/lib/app-dialog';
import { getErrorMessage, handleApiError } from '@/utils/errors';

export interface UseErrorHandlerOptions {
  /**
   * Tipo de notificación a usar
   * - 'toast': Muestra una notificación toast (por defecto)
   * - 'alert': Muestra un popup de alerta
   * - 'silent': No muestra notificación (solo registra en consola)
   */
  notificationType?: 'toast' | 'alert' | 'silent';

  /**
   * Título personalizado para el popup (solo aplica a 'alert')
   */
  title?: string;

  /**
   * Callback adicional que se ejecuta después de mostrar el error
   */
  onError?: (error: unknown) => void;
}

/**
 * Hook para manejo centralizado de errores
 *
 * @example
 * ```tsx
 * const { handleError } = useErrorHandler();
 *
 * try {
 *   await api.post('/users', data);
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 *
 * @example Con opciones
 * ```tsx
 * const { handleError } = useErrorHandler({
 *   notificationType: 'alert',
 *   title: 'Error en la operación'
 * });
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    notificationType = 'toast',
    title = 'Error',
    onError,
  } = options;

  const handleError = useCallback(
    (error: unknown) => {
      // Obtener mensaje de error procesado
      const errorMessage = getErrorMessage(error);
      const apiError = handleApiError(error);

      // Log en consola para debugging
      console.error('🔴 Error capturado:', {
        message: errorMessage,
        code: apiError.code,
        status: apiError.status,
        isRetryable: apiError.isRetryable,
        originalError: error,
      });

      // Mostrar notificación según el tipo configurado
      switch (notificationType) {
        case 'alert':
          showAlert({
            title,
            message: errorMessage,
            danger: true,
          });
          break;

        case 'toast':
          toast.error(errorMessage, {
            duration: apiError.isRetryable ? 5000 : 4000,
          });
          break;

        case 'silent':
          // No mostrar notificación, solo log
          break;
      }

      // Ejecutar callback adicional si existe
      if (onError) {
        onError(error);
      }
    },
    [notificationType, title, onError]
  );

  /**
   * Variante que muestra siempre un popup de alerta
   */
  const handleErrorWithAlert = useCallback(
    (error: unknown, customTitle?: string) => {
      const errorMessage = getErrorMessage(error);
      showAlert({
        title: customTitle || title,
        message: errorMessage,
        danger: true,
      });

      if (onError) {
        onError(error);
      }
    },
    [title, onError]
  );

  /**
   * Variante que muestra siempre un toast
   */
  const handleErrorWithToast = useCallback(
    (error: unknown, duration?: number) => {
      const errorMessage = getErrorMessage(error);
      const apiError = handleApiError(error);

      toast.error(errorMessage, {
        duration: duration || (apiError.isRetryable ? 5000 : 4000),
      });

      if (onError) {
        onError(error);
      }
    },
    [onError]
  );

  /**
   * Muestra un mensaje de éxito (útil para mantener consistencia)
   */
  const showSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  /**
   * Muestra un mensaje de información
   */
  const showInfo = useCallback((message: string) => {
    toast.info(message);
  }, []);

  /**
   * Muestra un mensaje de advertencia
   */
  const showWarning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  return {
    handleError,
    handleErrorWithAlert,
    handleErrorWithToast,
    showSuccess,
    showInfo,
    showWarning,
  };
}
