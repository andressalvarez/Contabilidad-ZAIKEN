import { api, ApiResponse } from '@/lib/api';

export interface TipoTransaccion {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTipoTransaccionDto {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateTipoTransaccionDto {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export class TiposTransaccionService {
  private static readonly endpoint = '/tipos-transaccion';

  // Obtener todos los tipos de transacción
  static async getAll(): Promise<TipoTransaccion[]> {
    const response: ApiResponse<TipoTransaccion[]> = await api.get(TiposTransaccionService.endpoint);
    return response.data?.data || [];
  }

  // Obtener un tipo de transacción por ID
  static async getById(id: number): Promise<TipoTransaccion> {
    const response: ApiResponse<TipoTransaccion> = await api.get(`${TiposTransaccionService.endpoint}/${id}`);
    if (!response.data) {
      throw new Error('Tipo de transacción no encontrado');
    }
    return response.data;
  }

  // Crear un nuevo tipo de transacción
  static async create(data: CreateTipoTransaccionDto): Promise<TipoTransaccion> {
    const response: ApiResponse<TipoTransaccion> = await api.post(TiposTransaccionService.endpoint, data);
    if (!response.data) {
      throw new Error('Error creando tipo de transacción');
    }
    return response.data;
  }

  // Actualizar un tipo de transacción
  static async update(id: number, data: UpdateTipoTransaccionDto): Promise<TipoTransaccion> {
    const response: ApiResponse<TipoTransaccion> = await api.patch(`${TiposTransaccionService.endpoint}/${id}`, data);
    if (!response.data) {
      throw new Error('Error actualizando tipo de transacción');
    }
    return response.data;
  }

  // Eliminar un tipo de transacción
  static async delete(id: number): Promise<void> {
    await api.delete(`${TiposTransaccionService.endpoint}/${id}`);
  }
}
