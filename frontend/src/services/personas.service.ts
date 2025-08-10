import { api, ApiResponse } from '@/lib/api';
import { Persona, CreatePersonaDto, UpdatePersonaDto } from '@/types';

export interface PersonaStats {
  persona: Persona;
  estadisticas: {
    transacciones: {
      total: number;
      montoTotal: number;
    };
    horas: {
      registros: number;
      horasTotales: number;
    };
    valorHora: number;
    distribuciones: {
      total: number;
      montoRecibido: number;
    };
    ingresosPorHora: number;
  };
}

export interface PersonasSummary {
  totalPersonas: number;
  totalParticipacion: number;
  participacionDisponible: number;
  horasTotales: number;
  aportesTotales: number;
  inversionTotal: number;
  valorHoraPromedio: number;
  participacionPromedio: number;
}

const ENDPOINT = '/personas';

export class PersonasService {
  // Obtener todas las personas
  static async getAll(includeInactive = false): Promise<Persona[]> {
    try {
      const params = includeInactive ? { includeInactive: 'true' } : {};
      const response = await api.get(ENDPOINT, { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching personas:', error);
      throw error;
    }
  }

  // Obtener personas activas
  static async getActive(): Promise<Persona[]> {
    try {
      const response = await api.get(`${ENDPOINT}/active`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching active personas:', error);
      throw error;
    }
  }

  // Obtener resumen general
  static async getSummary(): Promise<PersonasSummary> {
    try {
      const response = await api.get(`${ENDPOINT}/summary`);
      if (!response.data?.data) {
        throw new Error('Resumen no encontrado');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching personas summary:', error);
      throw error;
    }
  }

  // Obtener una persona por ID
  static async getById(id: number): Promise<Persona> {
    try {
      const response = await api.get(`${ENDPOINT}/${id}`);
      if (!response.data?.data) {
        throw new Error('Persona no encontrada');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching persona by ID:', error);
      throw error;
    }
  }

  // Obtener estadísticas de una persona
  static async getStats(id: number): Promise<PersonaStats> {
    try {
      const response = await api.get(`${ENDPOINT}/${id}/stats`);
      if (!response.data?.data) {
        throw new Error('Estadísticas no encontradas');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching persona stats:', error);
      throw error;
    }
  }

  // Crear una nueva persona
  static async create(data: CreatePersonaDto): Promise<Persona> {
    try {
      const response = await api.post(ENDPOINT, data);
      if (!response.data?.data) {
        throw new Error('Error creando persona');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating persona:', error);
      throw error;
    }
  }

  // Actualizar una persona
  static async update(id: number, data: UpdatePersonaDto): Promise<Persona> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}`, data);
      if (!response.data?.data) {
        throw new Error('Error actualizando persona');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating persona:', error);
      throw error;
    }
  }

  // Eliminar una persona
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT}/${id}`);
    } catch (error) {
      console.error('Error deleting persona:', error);
      throw error;
    }
  }
}
