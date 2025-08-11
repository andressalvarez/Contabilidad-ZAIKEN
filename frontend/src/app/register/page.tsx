'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { setAuthToken } from '@/lib/auth'
import MainLayout from '@/components/layout/MainLayout'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { email, password, nombre })
      const token = res.data?.token
      if (token) {
        setAuthToken(token)
        window.location.href = '/'
      } else {
        setError('Respuesta inválida del servidor')
      }
    } catch (err: any) {
      setError(err.message || 'Error de registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4">
          <h1 className="text-xl font-semibold">Crear cuenta</h1>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input className="w-full border rounded px-3 py-2" value={nombre} onChange={e=>setNombre(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white rounded py-2 hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </MainLayout>
  )
}


