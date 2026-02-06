import { api, ApiResponse } from '@/lib/api';
import { Categoria } from '@/types';

export interface CreateCategoriaDto {
  nombre: string;
  descripcion?: string;
  color?: string;
}

export interface UpdateCategoriaDto {
  nombre?: string;
  descripcion?: string;
  color?: string;
}

export class CategoriasService {
  private static readonly endpoint = '/categorias';

  // Get all categories
  static async getAll(): Promise<Categoria[]> {
    const response: ApiResponse<Categoria[]> = await api.get(CategoriasService.endpoint);

    // Backend returns { data: [...], message: "...", success: true }
    // We need to access response.data.data
    return response.data?.data || [];
  }

  // Get a category by ID
  static async getById(id: number): Promise<Categoria> {
    const response: ApiResponse<Categoria> = await api.get(`${CategoriasService.endpoint}/${id}`);
    if (!response.data) {
      throw new Error('Categoría no encontrada');
    }
    return response.data;
  }

  // Create a new category
  static async create(data: CreateCategoriaDto): Promise<Categoria> {
    const response: ApiResponse<Categoria> = await api.post(CategoriasService.endpoint, data);
    if (!response.data) {
      throw new Error('Error creando categoría');
    }
    return response.data;
  }

  // Update a category
  static async update(id: number, data: UpdateCategoriaDto): Promise<Categoria> {
    const response: ApiResponse<Categoria> = await api.patch(`${CategoriasService.endpoint}/${id}`, data);
    if (!response.data) {
      throw new Error('Error actualizando categoría');
    }
    return response.data;
  }

  // Delete a category
  static async delete(id: number): Promise<void> {
    await api.delete(`${CategoriasService.endpoint}/${id}`);
  }
}
