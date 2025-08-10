import { api, ApiResponse } from '@/lib/api';
import { Rol, CreateRolDto, UpdateRolDto, EstadisticasRol } from '@/types';

const ENDPOINT = '/roles';

export class RolesService {
  // Obtener todos los roles
  static async getAll(): Promise<Rol[]> {
    try {
      const response = await api.get(ENDPOINT);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  // Obtener roles activos
  static async getActive(): Promise<Rol[]> {
    try {
      const response = await api.get(`${ENDPOINT}/active`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching active roles:', error);
      throw error;
    }
  }

  // Obtener un rol por ID
  static async getById(id: number): Promise<Rol> {
    try {
      const response = await api.get(`${ENDPOINT}/${id}`);
      if (!response.data?.data) {
        throw new Error('Rol no encontrado');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching role by ID:', error);
      throw error;
    }
  }

  // Obtener estadísticas de un rol
  static async getStats(id: number): Promise<EstadisticasRol> {
    try {
      const response = await api.get(`${ENDPOINT}/${id}/stats`);
      if (!response.data?.data) {
        throw new Error('Estadísticas no encontradas');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching role stats:', error);
      throw error;
    }
  }

  // Crear un nuevo rol
  static async create(data: CreateRolDto): Promise<Rol> {
    try {
      const response = await api.post(ENDPOINT, data);
      if (!response.data?.data) {
        throw new Error('Error creando rol');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  // Actualizar un rol
  static async update(id: number, data: UpdateRolDto): Promise<Rol> {
    try {
      const response = await api.patch(`${ENDPOINT}/${id}`, data);
      if (!response.data?.data) {
        throw new Error('Error actualizando rol');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  // Eliminar un rol
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT}/${id}`);
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }
}
