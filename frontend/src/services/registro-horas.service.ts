import { api } from '@/lib/api';
import { RegistroHoras, CreateRegistroHorasDto, UpdateRegistroHorasDto } from '@/types';

const ENDPOINT = '/registro-horas';

export class RegistroHorasService {
  // Obtener todos los registros de horas
  static async getAll(): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(ENDPOINT);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching registro horas:', error);
      throw error;
    }
  }

  // Obtener registro de horas por ID
  static async getById(id: number): Promise<RegistroHoras> {
    try {
      const response = await api.get(`${ENDPOINT}/${id}`);
      if (!response.data?.data) {
        throw new Error('Registro de horas no encontrado');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching registro horas by ID:', error);
      throw error;
    }
  }

  // Obtener registros de horas de una persona
  static async getByPersonaId(personaId: number): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(`${ENDPOINT}/persona/${personaId}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching registro horas by persona:', error);
      throw error;
    }
  }

  // Crear un nuevo registro de horas
  static async create(data: CreateRegistroHorasDto): Promise<RegistroHoras> {
    try {
      const response = await api.post(ENDPOINT, data);
      if (!response.data?.data) {
        throw new Error('Error creando registro de horas');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating registro horas:', error);
      throw error;
    }
  }

  // Actualizar un registro de horas
  static async update(id: number, data: UpdateRegistroHorasDto): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}`, data);
      if (!response.data?.data) {
        throw new Error('Error actualizando registro de horas');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating registro horas:', error);
      throw error;
    }
  }

  // Eliminar un registro de horas
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT}/${id}`);
    } catch (error) {
      console.error('Error deleting registro horas:', error);
      throw error;
    }
  }

  // Obtener estadísticas de registros de horas
  static async getStats(): Promise<{
    totalHoras: number;
    totalRegistros: number;
    promedioHorasPorDia: number;
    personasActivas: number;
  }> {
    try {
      const response = await api.get(`${ENDPOINT}/stats`);
      if (!response.data?.data) {
        throw new Error('Estadísticas no encontradas');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching registro horas stats:', error);
      throw error;
    }
  }
}






