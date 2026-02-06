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

  // Authentication and password recovery methods
  requestPasswordReset: async (email: string) => {
    const { data } = await api.post('/auth/request-password-reset', { email })
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



