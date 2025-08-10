import { api } from '@/lib/api';
import { CreateCampanaDto, UpdateCampanaDto } from '@/types';

export class CampanasService {
  static async getAll() {
    const response = await api.get('/campanas');
    return response.data.data;
  }

  static async getById(id: number) {
    const response = await api.get(`/campanas/${id}`);
    return response.data.data;
  }

  static async create(data: CreateCampanaDto) {
    const response = await api.post('/campanas', data);
    return response.data.data;
  }

  static async update(id: number, data: UpdateCampanaDto) {
    const response = await api.patch(`/campanas/${id}`, data);
    return response.data.data;
  }

  static async delete(id: number) {
    const response = await api.delete(`/campanas/${id}`);
    return response.data;
  }

  static async getStats() {
    const response = await api.get('/campanas/stats');
    return response.data.data;
  }
}
