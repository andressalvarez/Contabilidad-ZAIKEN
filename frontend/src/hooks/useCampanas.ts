import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CampanasService } from '@/services/campanas.service';
import { CreateCampanaDto, UpdateCampanaDto, CampanaConMetricas } from '@/types';
import { toast } from 'sonner';

export const useCampanas = () => {
  return useQuery<CampanaConMetricas[]>({
    queryKey: ['campanas'],
    queryFn: CampanasService.getAll,
    retry: 1,
    retryDelay: 1000,
  });
};

export const useCampana = (id: number) => {
  return useQuery({
    queryKey: ['campanas', id],
    queryFn: () => CampanasService.getById(id),
    enabled: !!id,
  });
};

export const useCampanasStats = () => {
  return useQuery({
    queryKey: ['campanas', 'stats'],
    queryFn: CampanasService.getStats,
  });
};

export const useCreateCampana = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampanaDto) => CampanasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanas'] });
      toast.success('Campaña creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear campaña');
    },
  });
};

export const useUpdateCampana = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCampanaDto }) =>
      CampanasService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanas'] });
      toast.success('Campaña actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar campaña');
    },
  });
};

export const useDeleteCampana = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => CampanasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanas'] });
      toast.success('Campaña eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar campaña');
    },
  });
};






