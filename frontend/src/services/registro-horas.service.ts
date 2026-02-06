import { api } from '@/lib/api';
import { RegistroHoras, CreateRegistroHorasDto, UpdateRegistroHorasDto } from '@/types';

const ENDPOINT = '/registro-horas';

export class RegistroHorasService {
  // Get all time records
  static async getAll(): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(ENDPOINT);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching registro horas:', error);
      throw error;
    }
  }

  // Get time record by ID
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

  // Get time records by user ID
  static async getByUsuarioId(usuarioId: number): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(`${ENDPOINT}/usuario/${usuarioId}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching registro horas by usuario:', error);
      throw error;
    }
  }

  // Create a new time record
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

  // Update a time record
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

  // Delete a time record
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT}/${id}`);
    } catch (error) {
      console.error('Error deleting registro horas:', error);
      throw error;
    }
  }

  // Get time record statistics
  static async getStats(): Promise<{
    totalHoras: number;
    totalRegistros: number;
    promedioHorasPorDia: number;
    usuariosActivos: number;
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

  // Start a timer
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

  // Pause a timer
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

  // Resume a timer
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

  // Stop a timer
  static async stopTimer(
    id: number,
    descripcion?: string,
    timerInicio?: string,
    timerFin?: string
  ): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/timer/${id}/stop`, {
        descripcion,
        timerInicio,
        timerFin,
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

  // Get active timer for a user
  static async getActiveTimerByUsuario(usuarioId: number): Promise<RegistroHoras | null> {
    try {
      const response = await api.get(`${ENDPOINT}/timer/active-usuario/${usuarioId}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching active timer by usuario:', error);
      throw error;
    }
  }

  // Cancel a timer
  static async cancelTimer(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT}/timer/${id}/cancel`);
    } catch (error) {
      console.error('Error canceling timer:', error);
      throw error;
    }
  }

  // ==================== APPROVAL METHODS ====================

  // Get pending approval records
  static async getPending(): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(`${ENDPOINT}/approval/pending`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching pending registros:', error);
      throw error;
    }
  }

  // Get rejected records
  static async getRejected(): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(`${ENDPOINT}/approval/rejected`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching rejected registros:', error);
      throw error;
    }
  }

  // Approve a record
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

  // Reject a record
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

  // ==================== TIME EDITING METHODS ====================

  /**
   * Update timer times (start/end) and recalculate hours
   */
  static async updateTimerTimes(
    id: number,
    timerInicio?: string,
    timerFin?: string
  ): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}/edit-times`, {
        timerInicio,
        timerFin,
      });
      if (!response.data?.data) {
        throw new Error('Error actualizando tiempos');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating timer times:', error);
      throw error;
    }
  }

  /**
   * Resubmit a rejected record for review
   */
  static async resubmit(id: number): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}/resubmit`);
      if (!response.data?.data) {
        throw new Error('Error re-enviando registro');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error resubmitting registro:', error);
      throw error;
    }
  }

  /**
   * Get orphaned timers (running for more than X hours)
   */
  static async getOrphanedTimers(): Promise<RegistroHoras[]> {
    try {
      const response = await api.get(`${ENDPOINT}/timers/orphaned`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching orphaned timers:', error);
      throw error;
    }
  }

  /**
   * Force close an orphaned timer (admin only)
   */
  static async forceCloseTimer(id: number): Promise<RegistroHoras> {
    try {
      const response = await api.patch(`${ENDPOINT}/timer/${id}/force-close`);
      if (!response.data?.data) {
        throw new Error('Error cerrando timer');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error force closing timer:', error);
      throw error;
    }
  }
}






