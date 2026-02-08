import { useQuery } from '@tanstack/react-query';
import { TransaccionesService } from '@/services/transacciones.service';
import { UsuariosService } from '@/services/usuarios.service';
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
  usuarios: {
    totalUsuarios: number;
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
  usuarios: () => [...dashboardKeys.all, 'usuarios'] as const,
  categorias: () => [...dashboardKeys.all, 'categorias'] as const,
  campanas: () => [...dashboardKeys.all, 'campanas'] as const,
  resumenCategorias: (filtros: any) => [...dashboardKeys.all, 'resumen-categorias', filtros] as const,
  resumenCampanas: (filtros: any) => [...dashboardKeys.all, 'resumen-campanas', filtros] as const,
};

export function useDashboard(filtros: { fechaInicio?: string; fechaFin?: string } = {}) {
  console.log('useDashboard - Filters:', filtros);

  // Get transaction statistics using the service
  const { data: estadisticas, isLoading: loadingStats, error: errorStats } = useQuery({
    queryKey: dashboardKeys.stats(filtros),
    queryFn: async () => {
      console.log('Executing stats query...');
      try {
        const data = await TransaccionesService.getStats(filtros);
        console.log('Stats obtained:', data);
        return data;
      } catch (error) {
        console.error('Error in getStats:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  console.log('Stats obtained:', estadisticas);
  console.log('Stats error:', errorStats);

  // Get users summary using the service
  const { data: usuariosSummary, isLoading: loadingUsuarios } = useQuery({
    queryKey: dashboardKeys.usuarios(),
    queryFn: async () => {
      console.log('Executing users query...');
      try {
        const data = await UsuariosService.getSummary();
        console.log('Users data:', data);
        return data;
      } catch (error) {
        console.error('Error in getSummary:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get categories using the service
  const { data: categorias, isLoading: loadingCategorias } = useQuery({
    queryKey: dashboardKeys.categorias(),
    queryFn: async () => {
      console.log('Executing categories query...');
      try {
        const data = await CategoriasService.getAll();
        console.log('Categories data:', data);
        return data;
      } catch (error) {
        console.error('Error in getAll categories:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get campaigns using the service
  const { data: campanas, isLoading: loadingCampanas } = useQuery({
    queryKey: dashboardKeys.campanas(),
    queryFn: async () => {
      console.log('Executing campaigns query...');
      try {
        const data = await CampanasService.getAll();
        console.log('Campaigns data:', data);
        return data;
      } catch (error) {
        console.error('Error in getAll campaigns:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get summary by categories using the service
  const { data: resumenCategorias, isLoading: loadingResumenCategorias } = useQuery({
    queryKey: dashboardKeys.resumenCategorias(filtros),
    queryFn: async () => {
      console.log('Executing categories summary query...');
      try {
        const data = await TransaccionesService.getResumenPorCategorias(filtros);
        console.log('Categories summary data:', data);
        return data;
      } catch (error) {
        console.error('Error in getResumenPorCategorias:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get summary by campaigns using the service
  const { data: resumenCampanas, isLoading: loadingResumenCampanas } = useQuery({
    queryKey: dashboardKeys.resumenCampanas(filtros),
    queryFn: async () => {
      console.log('Executing expenses query...');
      try {
        const data = await TransaccionesService.getGastos(filtros);
        console.log('Expenses data:', data);
        return data;
      } catch (error) {
        console.error('Error in getGastos:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Prepare data for charts
  const gastosPorCategoria = resumenCategorias
    ?.filter(item => item.totalGastos > 0)
    .map(item => ({
      categoria: item.categoria,
      monto: item.totalGastos
    }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 19) || []; // Limit to 19 categories for the chart

  // Prepare data for expenses by campaign (using expenses data)
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
    .slice(0, 19) || []; // Limit to 19 expenses for the chart

  const isLoading = loadingStats || loadingUsuarios || loadingCategorias || loadingCampanas || loadingResumenCategorias || loadingResumenCampanas;

  const dashboardData: DashboardData | undefined = estadisticas && usuariosSummary && categorias && campanas && resumenCategorias && resumenCampanas
    ? {
        estadisticas: {
          totalIngresos: estadisticas.ingresos || 0,
          totalGastos: estadisticas.gastos || 0,
          balance: estadisticas.utilidad || 0,
          totalTransacciones: estadisticas.total || 0,
          transaccionesAprobadas: 0,
          transaccionesPendientes: 0,
          promedioIngresos: 0,
          promedioGastos: 0,
        },
        usuarios: {
          totalUsuarios: usuariosSummary.totales?.totalUsuarios || 0,
          totalParticipacion: usuariosSummary.totales?.totalParticipacion || 0,
          participacionDisponible: usuariosSummary.totales?.participacionDisponible || 0,
          horasTotales: usuariosSummary.totales?.horasTotales || 0,
          aportesTotales: usuariosSummary.totales?.aportesTotales || 0,
          inversionTotal: usuariosSummary.totales?.inversionTotal || 0,
          valorHoraPromedio: usuariosSummary.totales?.valorHoraPromedio || 0,
          participacionPromedio: usuariosSummary.totales?.participacionPromedio || 0,
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
