import { api } from '@/lib/api'
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '@/types'

export const UsuariosService = {
  list: async (): Promise<Usuario[]> => {
    const { data } = await api.get('/usuarios')
    return data?.data || []
  },

  create: async (payload: CreateUsuarioDto) => {
    const { data } = await api.post('/usuarios', payload)
    return data?.data
  },

  update: async (id: number, payload: UpdateUsuarioDto) => {
    const { data } = await api.patch(`/usuarios/${id}`, payload)
    return data?.data
  },

  remove: async (id: number) => {
    const { data } = await api.delete(`/usuarios/${id}`)
    return data
  },

  updateMe: async (payload: Partial<{ nombre: string; email: string; password: string }>) => {
    const { data } = await api.patch('/usuarios/me', payload)
    return data?.data
  },

  // Get summary with totals
  getSummary: async (): Promise<{
    usuarios: Usuario[];
    totales: {
      participacionTotal: number;
      horasTotales: number;
      inversionTotal: number;
    };
  }> => {
    const { data } = await api.get('/usuarios/summary')
    return data?.data || { usuarios: [], totales: { participacionTotal: 0, horasTotales: 0, inversionTotal: 0 } }
  },

  // Admin sends password reset email to a specific user
  sendPasswordReset: async (userId: number): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post(`/usuarios/${userId}/send-password-reset`)
    return data
  },

  // Authentication and password recovery methods (public)
  requestPasswordReset: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  resetPassword: async (token: string, password: string) => {
    const { data } = await api.post('/auth/reset-password', { token, password })
    return data
  },

  activateAccount: async (token: string) => {
    const { data } = await api.get(`/auth/activate?token=${token}`)
    return data
  },
}



