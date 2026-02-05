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

  // Obtener registros de horas de un usuario
  static async getByUsuarioId(usuarioId: number): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(`${ENDPOINT}/usuario/${usuarioId}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching registro horas by usuario:', error);
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

  // ==================== TIMER METHODS ====================

  // Iniciar un timer
  static async startTimer(data: {
    usuarioId?: number;
    campanaId?: number;
    descripcion?: string;
  }): Promise<RegistroHoras> {
    try {
      const response = await api.post(`${ENDPOINT}/timer/start`, data);
      if (!response.data?.data) {
        throw new Error('Error iniciando timer');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }

  // Pausar un timer
  static async pauseTimer(id: number): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/timer/${id}/pause`);
      if (!response.data?.data) {
        throw new Error('Error pausando timer');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error pausing timer:', error);
      throw error;
    }
  }

  // Reanudar un timer
  static async resumeTimer(id: number): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/timer/${id}/resume`);
      if (!response.data?.data) {
        throw new Error('Error reanudando timer');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error resuming timer:', error);
      throw error;
    }
  }

  // Detener un timer
  static async stopTimer(id: number, descripcion?: string): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/timer/${id}/stop`, {
        descripcion,
      });
      if (!response.data?.data) {
        throw new Error('Error deteniendo timer');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }

  // Obtener timer activo de un usuario
  static async getActiveTimerByUsuario(usuarioId: number): Promise<RegistroHoras | null> {
    try {
      const response = await api.get(`${ENDPOINT}/timer/active-usuario/${usuarioId}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching active timer by usuario:', error);
      throw error;
    }
  }

  // Cancelar un timer
  static async cancelTimer(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT}/timer/${id}/cancel`);
    } catch (error) {
      console.error('Error canceling timer:', error);
      throw error;
    }
  }

  // ==================== APPROVAL METHODS ====================

  // Obtener registros pendientes de aprobación
  static async getPending(): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(`${ENDPOINT}/pending`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching pending registros:', error);
      throw error;
    }
  }

  // Obtener registros rechazados
  static async getRejected(): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(`${ENDPOINT}/rejected`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching rejected registros:', error);
      throw error;
    }
  }

  // Aprobar un registro
  static async approve(id: number): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}/approve`);
      if (!response.data?.data) {
        throw new Error('Error aprobando registro');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error approving registro:', error);
      throw error;
    }
  }

  // Rechazar un registro
  static async reject(id: number, motivo: string): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}/reject`, { motivo });
      if (!response.data?.data) {
        throw new Error('Error rechazando registro');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error rejecting registro:', error);
      throw error;
    }
  }
}






