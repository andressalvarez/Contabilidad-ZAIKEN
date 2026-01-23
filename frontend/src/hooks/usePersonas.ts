import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PersonasService } from '@/services';
import type { PersonaStats, PersonasSummary } from '@/services/personas.service';
import { CreatePersonaDto, UpdatePersonaDto } from '@/types';
import { toast } from 'react-hot-toast';

// Query keys
export const personasKeys = {
  all: ['personas'] as const,
  lists: () => [...personasKeys.all, 'list'] as const,
  list: (filters: string) => [...personasKeys.lists(), { filters }] as const,
  details: () => [...personasKeys.all, 'detail'] as const,
  detail: (id: number) => [...personasKeys.details(), id] as const,
  stats: (id: number) => [...personasKeys.detail(id), 'stats'] as const,
  summary: () => [...personasKeys.all, 'summary'] as const,
};

// Hook para obtener todas las personas
export function usePersonas(includeInactive = false) {
  return useQuery({
    queryKey: personasKeys.list(includeInactive ? 'all' : 'active'),
    queryFn: () => PersonasService.getAll(includeInactive),
    staleTime: 1000 * 30, // 30 segundos
    refetchOnWindowFocus: true,
  });
}

// Hook para obtener personas activas
export function useActivePersonas() {
  return useQuery({
    queryKey: personasKeys.list('active'),
    queryFn: PersonasService.getActive,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para obtener resumen general de personas
export function usePersonasSummary() {
  return useQuery({
    queryKey: personasKeys.summary(),
    queryFn: PersonasService.getSummary,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

// Hook para obtener una persona específica
export function usePersona(id: number) {
  return useQuery({
    queryKey: personasKeys.detail(id),
    queryFn: () => PersonasService.getById(id),
    enabled: !!id,
  });
}

// Hook para obtener estadísticas de una persona
export function usePersonaStats(id: number) {
  return useQuery({
    queryKey: personasKeys.stats(id),
    queryFn: () => PersonasService.getStats(id),
    enabled: !!id,
  });
}

// Hook para crear una persona
export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonaDto) => PersonasService.create(data),
    retry: 2,
    retryDelay: 1000,
    onSuccess: (newPersona) => {
      // Invalidar y refetch las listas
      queryClient.invalidateQueries({ queryKey: personasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personasKeys.summary() });

      // Optimistamente actualizar el cache
      queryClient.setQueryData(personasKeys.detail(newPersona.id), newPersona);

      // Invalidate transacciones and estadisticas since they depend on personas
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });

      toast.success('Persona creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la persona');
    },
  });
}

// Hook para actualizar una persona
export function useUpdatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePersonaDto }) =>
      PersonasService.update(id, data),
    retry: 2,
    retryDelay: 1000,
    onSuccess: (updatedPersona) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: personasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personasKeys.summary() });
      queryClient.setQueryData(personasKeys.detail(updatedPersona.id), updatedPersona);

      // También invalidar estadísticas si existen
      queryClient.invalidateQueries({ queryKey: personasKeys.stats(updatedPersona.id) });

      // Invalidate transacciones and estadisticas since they depend on personas
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });

      toast.success('Persona actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la persona');
    },
  });
}

// Hook para eliminar una persona
export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => PersonasService.delete(id),
    retry: 2,
    retryDelay: 1000,
    onSuccess: (_, deletedId) => {
      // Invalidar listas y resumen
      queryClient.invalidateQueries({ queryKey: personasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personasKeys.summary() });

      // Remover la persona específica del cache
      queryClient.removeQueries({ queryKey: personasKeys.detail(deletedId) });
      queryClient.removeQueries({ queryKey: personasKeys.stats(deletedId) });

      // Invalidate transacciones and estadisticas since they depend on personas
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });

      toast.success('Persona procesada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al procesar la persona');
    },
  });
}
