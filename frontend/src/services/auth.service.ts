import { api } from '@/lib/api';

export interface UserProfile {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
  negocioId: number;
  securityRoleId: number;
  securityRoleName?: string;
  negocioRoleName?: string;
  securityRole?: {
    id: number;
    name: string;
  };
  rolNegocio?: {
    id: number;
    nombreRol: string;
  };
  createdAt: string;
  updatedAt: string;
  negocio?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
}

export const AuthService = {
  // Get current user information
  getMe: async (): Promise<UserProfile> => {
    try {
      const response = await api.get('/auth/me');
      if (!response.data?.data) {
        throw new Error('Could not get user information');
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
    securityRoleId?: number;
    negocioId?: number;
    nombreNegocio?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};
