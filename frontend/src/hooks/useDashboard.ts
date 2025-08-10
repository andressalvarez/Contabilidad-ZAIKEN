import { useQuery } from '@tanstack/react-query';
import { TransaccionesService } from '@/services/transacciones.service';
import { PersonasService } from '@/services/personas.service';
import { CategoriasService } from '@/services/categorias.service';
import { CampanasService } from '@/services/campanas.service';

export interface DashboardData {
  estadisticas: {
    totalIngresos: number;
    totalGastos: number;
    balance: number;
    totalTransacciones: number;
    transaccionesAprobadas: number;
    transaccionesPendientes: number;
    promedioIngresos: number;
    promedioGastos: number;
  };
  personas: {
    totalPersonas: number;
    totalParticipacion: number;
    participacionDisponible: number;
    horasTotales: number;
    aportesTotales: number;
    inversionTotal: number;
    valorHoraPromedio: number;
    participacionPromedio: number;
  };
  categorias: {
    totalCategorias: number;
    resumenPorCategorias: Array<{
      categoria: string;
      totalIngresos: number;
      totalGastos: number;
      balance: number;
      transacciones: number;
    }>;
  };
  campanas: {
    totalCampanas: number;
  };
  gastosPorCategoria: Array<{
    categoria: string;
    monto: number;
  }>;
  gastosPorCampana: Array<{
    campana: string;
    monto: number;
  }>;
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (filtros: any) => [...dashboardKeys.all, 'stats', filtros] as const,
  personas: () => [...dashboardKeys.all, 'personas'] as const,
  categorias: () => [...dashboardKeys.all, 'categorias'] as const,
  campanas: () => [...dashboardKeys.all, 'campanas'] as const,
  resumenCategorias: (filtros: any) => [...dashboardKeys.all, 'resumen-categorias', filtros] as const,
  resumenCampanas: (filtros: any) => [...dashboardKeys.all, 'resumen-campanas', filtros] as const,
};

export function useDashboard(filtros: { fechaInicio?: string; fechaFin?: string } = {}) {
  console.log('useDashboard - Filtros:', filtros);

  // Obtener estadísticas de transacciones usando el servicio
  const { data: estadisticas, isLoading: loadingStats, error: errorStats } = useQuery({
    queryKey: dashboardKeys.stats(filtros),
    queryFn: async () => {
      console.log('Ejecutando query de estadísticas...');
      try {
        const data = await TransaccionesService.getStats(filtros);
        console.log('Estadísticas obtenidas:', data);
        return data;
      } catch (error) {
        console.error('Error en getStats:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });

  console.log('Estadísticas obtenidas:', estadisticas);
  console.log('Error en estadísticas:', errorStats);

  // Obtener resumen de personas usando el servicio
  const { data: personasSummary, isLoading: loadingPersonas } = useQuery({
    queryKey: dashboardKeys.personas(),
    queryFn: async () => {
      console.log('Ejecutando query de personas...');
      try {
        const data = await PersonasService.getSummary();
        console.log('Personas data:', data);
        return data;
      } catch (error) {
        console.error('Error en getSummary:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Obtener categorías usando el servicio
  const { data: categorias, isLoading: loadingCategorias } = useQuery({
    queryKey: dashboardKeys.categorias(),
    queryFn: async () => {
      console.log('Ejecutando query de categorías...');
      try {
        const data = await CategoriasService.getAll();
        console.log('Categorías data:', data);
        return data;
      } catch (error) {
        console.error('Error en getAll categorías:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Obtener campañas usando el servicio
  const { data: campanas, isLoading: loadingCampanas } = useQuery({
    queryKey: dashboardKeys.campanas(),
    queryFn: async () => {
      console.log('Ejecutando query de campañas...');
      try {
        const data = await CampanasService.getAll();
        console.log('Campañas data:', data);
        return data;
      } catch (error) {
        console.error('Error en getAll campañas:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Obtener resumen por categorías usando el servicio
  const { data: resumenCategorias, isLoading: loadingResumenCategorias } = useQuery({
    queryKey: dashboardKeys.resumenCategorias(filtros),
    queryFn: async () => {
      console.log('Ejecutando query de resumen categorías...');
      try {
        const data = await TransaccionesService.getResumenPorCategorias(filtros);
        console.log('Resumen categorías data:', data);
        return data;
      } catch (error) {
        console.error('Error en getResumenPorCategorias:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Obtener resumen por campañas usando el servicio
  const { data: resumenCampanas, isLoading: loadingResumenCampanas } = useQuery({
    queryKey: dashboardKeys.resumenCampanas(filtros),
    queryFn: async () => {
      console.log('Ejecutando query de gastos...');
      try {
        const data = await TransaccionesService.getGastos(filtros);
        console.log('Gastos data:', data);
        return data;
      } catch (error) {
        console.error('Error en getGastos:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Preparar datos para los gráficos
  const gastosPorCategoria = resumenCategorias
    ?.filter(item => item.totalGastos > 0)
    .map(item => ({
      categoria: item.categoria,
      monto: item.totalGastos
    }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 19) || []; // Limitar a 19 categorías para el gráfico

  // Preparar datos para gastos por tipo de gasto (usando datos de gastos)
  const gastosPorCampana = resumenCampanas
    ?.filter(item => item.monto > 0)
    .reduce((acc, item) => {
      const categoriaNombre = item.categoria?.nombre || 'Sin categoría';
      const existing = acc.find(g => g.campana === categoriaNombre);

      if (existing) {
        existing.monto += item.monto;
      } else {
        acc.push({
          campana: categoriaNombre,
          monto: item.monto
        });
      }

      return acc;
    }, [] as Array<{ campana: string; monto: number }>)
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 19) || []; // Limitar a 19 gastos para el gráfico

  const isLoading = loadingStats || loadingPersonas || loadingCategorias || loadingCampanas || loadingResumenCategorias || loadingResumenCampanas;

  const dashboardData: DashboardData | undefined = estadisticas && personasSummary && categorias && campanas && resumenCategorias && resumenCampanas
    ? {
        estadisticas: {
          totalIngresos: estadisticas.ingresos ?? 0,
          totalGastos: estadisticas.gastos ?? 0,
          balance: estadisticas.utilidad ?? 0,
          totalTransacciones: estadisticas.total ?? 0,
          transaccionesAprobadas: 0,
          transaccionesPendientes: 0,
          promedioIngresos: 0,
          promedioGastos: 0,
        },
        personas: {
          totalPersonas: personasSummary.totalPersonas ?? 0,
          totalParticipacion: personasSummary.totalParticipacion ?? 0,
          participacionDisponible: personasSummary.participacionDisponible ?? 0,
          horasTotales: personasSummary.horasTotales ?? 0,
          aportesTotales: personasSummary.aportesTotales ?? 0,
          inversionTotal: personasSummary.inversionTotal ?? 0,
          valorHoraPromedio: personasSummary.valorHoraPromedio ?? 0,
          participacionPromedio: personasSummary.participacionPromedio ?? 0,
        },
        categorias: {
          totalCategorias: categorias.length,
          resumenPorCategorias: resumenCategorias,
        },
        campanas: {
          totalCampanas: campanas.length,
        },
        gastosPorCategoria,
        gastosPorCampana,
      }
    : undefined;

  return {
    data: dashboardData,
    isLoading,
    error: null,
  };
}
