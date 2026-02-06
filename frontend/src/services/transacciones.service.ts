import { api, ApiResponse } from '@/lib/api';
import { Transaccion, CreateTransaccionDto, UpdateTransaccionDto, TipoTransaccion } from '@/types';

export interface FiltrosTransacciones {
  fechaInicio?: string;
  fechaFin?: string;
  tipo?: TipoTransaccion;
  categoria?: string;
  usuarioId?: number;
  personaId?: number;
  campanaId?: number;
  aprobado?: boolean;
}

export interface EstadisticasTransacciones {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  totalTransacciones: number;
  transaccionesAprobadas: number;
  transaccionesPendientes: number;
  promedioIngresos: number;
  promedioGastos: number;
  periodoAnalizado: {
    inicio: string;
    fin: string;
  };
}

export interface ResumenPorCategoria {
  categoria: string;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  transacciones: number;
}

export interface TendenciaMensual {
  mes: number;
  nombre: string;
  ingresos: number;
  gastos: number;
  balance: number;
  transacciones: number;
}

const ENDPOINT = '/transacciones';

export class TransaccionesService {
  // Get all transactions with filters
  static async getAll(filtros: FiltrosTransacciones = {}): Promise<Transaccion[]> {
    try {
      const params = new URLSearchParams();

      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(
        `${ENDPOINT}${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // Get recent transactions
  static async getRecent(limit = 10): Promise<Transaccion[]> {
    try {
      const response = await api.get(`${ENDPOINT}/recent?limit=${limit}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  // Get pending transactions
  static async getPending(): Promise<Transaccion[]> {
    try {
      const response = await api.get(`${ENDPOINT}/pending`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      throw error;
    }
  }

  // Get statistics
  static async getStats(filtros: FiltrosTransacciones = {}): Promise<EstadisticasTransacciones> {
    try {
      console.log('TransaccionesService.getStats - Filters:', filtros);

      const params = new URLSearchParams();

      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const url = `${ENDPOINT}/stats${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Request URL:', url);

      const response = await api.get(url);
      console.log('Complete response:', response);

      if (!response.data?.data) {
        console.error('No data in response');
        throw new Error('Estadísticas no encontradas');
      }

      console.log('Statistics data:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      throw error;
    }
  }

  // Get expense types summary
  static async getResumenPorTiposGasto(filtros: {
    fechaInicio?: string;
    fechaFin?: string;
    personaId?: string;
    tipo?: string;
    categoria?: string;
    campanaId?: string;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`${ENDPOINT}/resumen-tipos-gasto?${params}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching types of expense summary:', error);
      throw error;
    }
  }

  // Get expenses summary by campaign
  static async getResumenGastosPorCampana(filtros: {
    fechaInicio?: string;
    fechaFin?: string;
    personaId?: string;
    campanaId?: string;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`${ENDPOINT}/resumen-gastos-por-campana?${params}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching campaign expense summary:', error);
      throw error;
    }
  }

  // Get expenses
  static async getGastos(filtros: {
    fechaInicio?: string;
    fechaFin?: string;
    categoria?: string;
    personaId?: string;
    campanaId?: string;
    aprobado?: boolean;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.append(key, value.toString());
      });

      const response = await api.get(`${ENDPOINT}/gastos?${params}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  // Get summary by categories
  static async getResumenPorCategorias(filtros: {
    fechaInicio?: string;
    fechaFin?: string;
    personaId?: string;
    tipo?: string;
    categoria?: string;
    campanaId?: string;
  } = {}): Promise<ResumenPorCategoria[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`${ENDPOINT}/resumen-categorias?${params}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching categories summary:', error);
      throw error;
    }
  }

  // Get monthly trends
  static async getTendenciasMensuales(año?: number, filtros: {
    personaId?: string;
    tipo?: string;
    categoria?: string;
    campanaId?: string;
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<TendenciaMensual[]> {
    try {
      const params = new URLSearchParams();
      if (año) params.append('año', año.toString());

      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`${ENDPOINT}/tendencias-mensuales?${params}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      throw error;
    }
  }

  // Get a transaction by ID
  static async getById(id: number): Promise<Transaccion> {
    try {
      const response = await api.get(`${ENDPOINT}/${id}`);
      if (!response.data?.data) {
        throw new Error('Transacción no encontrada');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching transaction by ID:', error);
      throw error;
    }
  }

  // Create a new transaction
  static async create(data: CreateTransaccionDto): Promise<Transaccion> {
    try {
      const response = await api.post(ENDPOINT, data);
      if (!response.data?.data) {
        throw new Error('Error creando transacción');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Update a transaction
  static async update(id: number, data: UpdateTransaccionDto): Promise<Transaccion> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}`, data);
      if (!response.data?.data) {
        throw new Error('Error actualizando transacción');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Approve transaction
  static async approve(id: number): Promise<Transaccion> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}/approve`);
      if (!response.data?.data) {
        throw new Error('Error aprobando transacción');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error approving transaction:', error);
      throw error;
    }
  }

  // Reject transaction
  static async reject(id: number): Promise<Transaccion> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}/reject`);
      if (!response.data?.data) {
        throw new Error('Error rechazando transacción');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      throw error;
    }
  }

  // Delete a transaction
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT}/${id}`);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}
