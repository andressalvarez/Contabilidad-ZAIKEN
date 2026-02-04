import { api } from '@/lib/api';
import { ValorHora, CreateValorHoraDto, UpdateValorHoraDto } from '@/types';

const ENDPOINT = '/valor-hora';

export class ValorHoraService {
  // Obtener todos los valores por hora
  static async getAll(): Promise<ValorHora[]> {
    try {
      const response = await api.get(ENDPOINT);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching valor hora:', error);
      throw error;
    }
  }

  // Obtener valor por hora por ID
  static async getById(id: number): Promise<ValorHora> {
    try {
      const response = await api.get(`${ENDPOINT}/${id}`);
      if (!response.data?.data) {
        throw new Error('Valor por hora no encontrado');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching valor hora by ID:', error);
      throw error;
    }
  }

  // ⚠️ Deprecado - usar getByUsuarioId
  /** @deprecated Usar getByUsuarioId en su lugar */
  static async getByPersonaId(personaId: number): Promise<ValorHora[]> {
    try {
      const response = await api.get(`${ENDPOINT}/persona/${personaId}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching valor hora by persona:', error);
      throw error;
    }
  }

  // ✅ Obtener valores por hora de un usuario
  static async getByUsuarioId(usuarioId: number): Promise<ValorHora[]> {
    try {
      const response = await api.get(`${ENDPOINT}/usuario/${usuarioId}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching valor hora by usuario:', error);
      throw error;
    }
  }

  // Crear un nuevo valor por hora
  static async create(data: CreateValorHoraDto): Promise<ValorHora> {
    try {
      const response = await api.post(ENDPOINT, data);
      if (!response.data?.data) {
        throw new Error('Error creando valor por hora');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating valor hora:', error);
      throw error;
    }
  }

  // Actualizar un valor por hora
  static async update(id: number, data: UpdateValorHoraDto): Promise<ValorHora> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}`, data);
      if (!response.data?.data) {
        throw new Error('Error actualizando valor por hora');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating valor hora:', error);
      throw error;
    }
  }

  // Eliminar un valor por hora
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT}/${id}`);
    } catch (error) {
      console.error('Error deleting valor hora:', error);
      throw error;
    }
  }

  // Obtener estadísticas de valores por hora
  static async getStats(): Promise<{
    valorPromedio: number;
    valorMaximo: number;
    personasConValor: number;
    totalValores: number;
  }> {
    try {
      const response = await api.get(`${ENDPOINT}/stats`);
      if (!response.data?.data) {
        throw new Error('Estadísticas no encontradas');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching valor hora stats:', error);
      throw error;
    }
  }
}
