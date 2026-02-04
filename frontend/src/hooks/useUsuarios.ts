import { useQuery } from '@tanstack/react-query';
import { UsuariosService } from '@/services/usuarios.service';

// Query keys
export const usuariosKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosKeys.all, 'list'] as const,
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
