import { api } from '@/lib/api';

export interface UserProfile {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  negocioId: number;
  createdAt: string;
  updatedAt: string;
  negocio?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  personas?: Array<{
    id: number;
    nombre: string;
    email?: string;
  }>;
}

export const AuthService = {
  // Obtener información del usuario actual
  getMe: async (): Promise<UserProfile> => {
    try {
      const response = await api.get('/auth/me');
      if (!response.data?.data) {
        throw new Error('No se pudo obtener la información del usuario');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Login
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Register
  register: async (data: {
    email: string;
    password: string;
    nombre: string;
    rol?: string;
    negocioId?: number;
    nombreNegocio?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};
