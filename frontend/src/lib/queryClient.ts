import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,        // 5 min (igual a tu hook)
        refetchOnWindowFocus: false,
        retry: 2,
        gcTime: 10 * 60 * 1000, // 10 minutos de garbage collection
      },
      mutations: {
        retry: 1,
      },
    },
  });
}
