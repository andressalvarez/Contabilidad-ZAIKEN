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

  // Obtener todas las categorías
  static async getAll(): Promise<Categoria[]> {
    const response: ApiResponse<Categoria[]> = await api.get(CategoriasService.endpoint);

    // El backend devuelve { data: [...], message: "...", success: true }
    // Necesitamos acceder a response.data.data
    return response.data?.data || [];
  }

  // Obtener una categoría por ID
  static async getById(id: number): Promise<Categoria> {
    const response: ApiResponse<Categoria> = await api.get(`${CategoriasService.endpoint}/${id}`);
    if (!response.data) {
      throw new Error('Categoría no encontrada');
    }
    return response.data;
  }

  // Crear una nueva categoría
  static async create(data: CreateCategoriaDto): Promise<Categoria> {
    const response: ApiResponse<Categoria> = await api.post(CategoriasService.endpoint, data);
    if (!response.data) {
      throw new Error('Error creando categoría');
    }
    return response.data;
  }

  // Actualizar una categoría
  static async update(id: number, data: UpdateCategoriaDto): Promise<Categoria> {
    const response: ApiResponse<Categoria> = await api.patch(`${CategoriasService.endpoint}/${id}`, data);
    if (!response.data) {
      throw new Error('Error actualizando categoría');
    }
    return response.data;
  }

  // Eliminar una categoría
  static async delete(id: number): Promise<void> {
    await api.delete(`${CategoriasService.endpoint}/${id}`);
  }
}
