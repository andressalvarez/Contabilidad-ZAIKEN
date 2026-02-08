import { useQuery } from '@tanstack/react-query';
import { UsuariosService } from '@/services/usuarios.service';

// Query keys
export const usuariosKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosKeys.all, 'list'] as const,
  summary: () => [...usuariosKeys.all, 'summary'] as const,
};

// Hook to get all users
export function useUsuarios(enabled = true) {
  return useQuery({
    queryKey: usuariosKeys.lists(),
    queryFn: UsuariosService.list,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

// Hook to get users summary
export function useUsuariosSummary(enabled = true) {
  return useQuery({
    queryKey: usuariosKeys.summary(),
    queryFn: UsuariosService.getSummary,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
