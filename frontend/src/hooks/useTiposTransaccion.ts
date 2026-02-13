import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface TipoTransaccion {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTipoTransaccionDto {
  nombre: string;
  descripcion: string;
  activo?: boolean;
}

export interface UpdateTipoTransaccionDto {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export const useTiposTransaccion = () => {
  return useQuery({
    queryKey: ['tipos-transaccion'],
    queryFn: async (): Promise<TipoTransaccion[]> => {
      const response = await api.get('/tipos-transaccion');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateTipoTransaccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTipoTransaccionDto): Promise<TipoTransaccion> => {
      const response = await api.post('/tipos-transaccion', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-transaccion'] });
      toast.success('Tipo de transacción creado exitosamente');
    },
    
  });
};

export const useUpdateTipoTransaccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTipoTransaccionDto }): Promise<TipoTransaccion> => {
      const response = await api.patch(`/tipos-transaccion/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-transaccion'] });
      toast.success('Tipo de transacción actualizado exitosamente');
    },
    
  });
};

export const useDeleteTipoTransaccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/tipos-transaccion/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-transaccion'] });
      toast.success('Tipo de transacción eliminado exitosamente');
    },
    
  });
};
