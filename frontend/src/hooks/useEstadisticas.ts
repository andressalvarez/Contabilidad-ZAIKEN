import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Hook para estadísticas generales
export const useEstadisticas = (filters: any) => {
  return useQuery({
    queryKey: ['estadisticas', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.personaId) params.append('personaId', filters.personaId);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.tipo) params.append('tipo', filters.tipo);

      const response = await api.get(`/transacciones/stats?${params.toString()}`);
      console.log('DEBUG useEstadisticas - response:', response.data);
      return response.data.data; // Corregido: devolver response.data.data
    },
    enabled: true
  });
};

// Hook para tendencias mensuales
export const useTendenciasMensuales = (año: number, filters: any) => {
  return useQuery({
    queryKey: ['tendencias-mensuales', año, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('año', año.toString());
      if (filters.personaId) params.append('personaId', filters.personaId);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.tipo) params.append('tipo', filters.tipo);

      const response = await api.get(`/transacciones/tendencias-mensuales?${params.toString()}`);
      return response.data;
    },
    enabled: true
  });
};

// Hook para resumen por categorías
export const useResumenPorCategorias = (filters: any) => {
  return useQuery({
    queryKey: ['resumen-categorias', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.personaId) params.append('personaId', filters.personaId);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.tipo) params.append('tipo', filters.tipo);

      const response = await api.get(`/transacciones/resumen-categorias?${params.toString()}`);
      const data = response.data;
      if (data && Array.isArray(data.data)) {
        return data.data;
      } else if (data && data.data && typeof data.data === 'object' && data.data !== null) {
        // Si es objeto, retorna los valores como array
        return Object.values(data.data);
      } else {
        return [];
      }
    },
    enabled: true
  });
};

// Hook para estadísticas de campañas
export const useEstadisticasCampanas = (filters: any) => {
  return useQuery({
    queryKey: ['estadisticas-campanas', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.personaId) params.append('personaId', filters.personaId);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);

      const response = await api.get(`/campanas/stats?${params.toString()}`);
      const data = response.data;
      // Puede ser un array directamente o un objeto con .data
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else if (data && data.data && typeof data.data === 'object' && data.data !== null) {
        return Object.values(data.data);
      } else {
        return [];
      }
    },
    enabled: true
  });
};
