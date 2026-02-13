'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage, isRetryableError } from '@/utils/errors';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          // No reintentar en errores 4xx (excepto 408 Request Timeout)
          if (error?.status >= 400 && error?.status < 500 && error?.status !== 408) {
            return false;
          }
          // Usar la utilidad para verificar si es reintentar
          if (!isRetryableError(error)) {
            return false;
          }
          return failureCount < 3;
        },
        // Manejador global de errores para queries
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error);
          console.error('❌ Query Error:', errorMessage, error);

          // Nota: No mostramos toast aquí porque el interceptor de axios ya lo hace
          // Esto evita duplicar notificaciones
        },
      },
      mutations: {
        retry: false,
        // Manejador global de errores para mutations
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error);
          console.error('❌ Mutation Error:', errorMessage, error);

          // Nota: No mostramos toast aquí porque el interceptor de axios ya lo hace
          // Esto evita duplicar notificaciones
        },
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
