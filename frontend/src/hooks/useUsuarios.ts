import { useQuery } from '@tanstack/react-query';
import { UsuariosService } from '@/services/usuarios.service';

// Query keys
export const usuariosKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosKeys.all, 'list'] as const,
  summary: () => [...usuariosKeys.all, 'summary'] as const,
};

// Hook para obtener todos los usuarios
export function useUsuarios() {
  return useQuery({
    queryKey: usuariosKeys.lists(),
    queryFn: UsuariosService.list,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
  });
}

// Hook para obtener resumen de usuarios
export function useUsuariosSummary() {
  return useQuery({
    queryKey: usuariosKeys.summary(),
    queryFn: UsuariosService.getSummary,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}
