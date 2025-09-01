import { api } from '@/lib/api'

export type Usuario = {
  id: number
  email: string
  nombre: string
  rol: 'ADMIN' | 'USER'
  activo: boolean
  createdAt: string
}

export const UsuariosService = {
  list: async (): Promise<Usuario[]> => {
    const { data } = await api.get('/usuarios')
    return data
  },
  create: async (payload: { email: string; nombre: string; rol: string; password: string; activo?: boolean }) => {
    const { data } = await api.post('/usuarios', payload)
    return data
  },
  update: async (id: number, payload: Partial<{ email: string; nombre: string; rol: string; password: string; activo: boolean }>) => {
    const { data } = await api.patch(`/usuarios/${id}`, payload)
    return data
  },
  remove: async (id: number) => {
    const { data } = await api.delete(`/usuarios/${id}`)
    return data
  }
}



