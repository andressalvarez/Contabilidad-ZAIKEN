import { api, ApiResponse } from '@/lib/api';
import { Rol, CreateRolDto, UpdateRolDto, EstadisticasRol } from '@/types';

const ENDPOINT = '/roles';

export class RolesService {
  // Get all roles
  static async getAll(): Promise<Rol[]> {
    try {
      const response = await api.get(ENDPOINT);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  // Get active roles
  static async getActive(): Promise<Rol[]> {
    try {
      const response = await api.get(`${ENDPOINT}/active`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching active roles:', error);
      throw error;
    }
  }

  // Get a role by ID
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

  // Get role statistics
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

  // Create a new role
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

  // Update a role
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

  // Delete a role
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINT}/${id}`);
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }
}
