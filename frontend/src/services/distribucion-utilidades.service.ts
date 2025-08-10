import { api, ApiResponse } from '@/lib/api';
import { DistribucionUtilidades, DistribucionDetalle } from '@/types';

export interface CreateDistribucionUtilidadesDto {
  periodo: string;
  fecha: string;
  utilidadTotal: number;
  estado?: string;
}

export interface UpdateDistribucionUtilidadesDto extends Partial<CreateDistribucionUtilidadesDto> {}

export interface CreateDistribucionDetalleDto {
  distribucionId: number;
  personaId: number;
  porcentajeParticipacion: number;
  montoDistribuido: number;
}

export interface UpdateDistribucionDetalleDto extends Partial<CreateDistribucionDetalleDto> {}

export interface EstadisticasDistribucion {
  totalDistribuciones: number;
  totalUtilidades: number;
  totalDistribuido: number;
  distribucionesPendientes: number;
  distribucionesCompletadas: number;
  promedioPorPersona: number;
}

const ENDPOINT_DISTRIBUCION = '/distribucion-utilidades';
const ENDPOINT_DETALLE = '/distribucion-detalle';

export class DistribucionUtilidadesService {
  // Obtener todas las distribuciones
  static async getAll(): Promise<DistribucionUtilidades[]> {
    try {
      const response = await api.get(ENDPOINT_DISTRIBUCION);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching distribuciones:', error);
      throw error;
    }
  }

  // Obtener una distribución por ID
  static async getById(id: number): Promise<DistribucionUtilidades> {
    try {
      const response = await api.get(`${ENDPOINT_DISTRIBUCION}/${id}`);
      if (!response.data?.data) {
        throw new Error('Distribución no encontrada');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching distribucion by ID:', error);
      throw error;
    }
  }

  // Crear una nueva distribución
  static async create(data: CreateDistribucionUtilidadesDto): Promise<DistribucionUtilidades> {
    try {
      const response = await api.post(ENDPOINT_DISTRIBUCION, data);
      if (!response.data?.data) {
        throw new Error('Error creando distribución');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating distribucion:', error);
      throw error;
    }
  }

  // Actualizar una distribución
  static async update(id: number, data: UpdateDistribucionUtilidadesDto): Promise<DistribucionUtilidades> {
    try {
      const response = await api.patch(`${ENDPOINT_DISTRIBUCION}/${id}`, data);
      if (!response.data?.data) {
        throw new Error('Error actualizando distribución');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating distribucion:', error);
      throw error;
    }
  }

  // Eliminar una distribución
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT_DISTRIBUCION}/${id}`);
    } catch (error) {
      console.error('Error deleting distribucion:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  static async getStats(): Promise<EstadisticasDistribucion> {
    try {
      const response = await api.get(`${ENDPOINT_DISTRIBUCION}/stats`);
      if (!response.data?.data) {
        throw new Error('Estadísticas no encontradas');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching distribucion stats:', error);
      throw error;
    }
  }

  // Distribuir automáticamente
  static async distribuirAutomaticamente(distribucionId: number): Promise<void> {
    try {
      await api.post(`${ENDPOINT_DISTRIBUCION}/${distribucionId}/distribuir-automatico`);
    } catch (error) {
      console.error('Error distribuyendo automáticamente:', error);
      throw error;
    }
  }

  // Obtener detalles de una distribución
  static async getDetalles(distribucionId: number): Promise<DistribucionDetalle[]> {
    try {
      const response = await api.get(`${ENDPOINT_DETALLE}?distribucionId=${distribucionId}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching distribucion detalles:', error);
      throw error;
    }
  }

  // Crear detalle de distribución
  static async createDetalle(data: CreateDistribucionDetalleDto): Promise<DistribucionDetalle> {
    try {
      const response = await api.post(ENDPOINT_DETALLE, data);
      if (!response.data?.data) {
        throw new Error('Error creando detalle de distribución');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating distribucion detalle:', error);
      throw error;
    }
  }

  // Actualizar detalle de distribución
  static async updateDetalle(id: number, data: UpdateDistribucionDetalleDto): Promise<DistribucionDetalle> {
    try {
      const response = await api.patch(`${ENDPOINT_DETALLE}/${id}`, data);
      if (!response.data?.data) {
        throw new Error('Error actualizando detalle de distribución');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating distribucion detalle:', error);
      throw error;
    }
  }

  // Eliminar detalle de distribución
  static async deleteDetalle(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT_DETALLE}/${id}`);
    } catch (error) {
      console.error('Error deleting distribucion detalle:', error);
      throw error;
    }
  }
}
