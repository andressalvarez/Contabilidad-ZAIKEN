'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { setAuthToken } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const token = res.data?.token
      if (token) {
        setAuthToken(token)
        window.location.href = '/'
      } else {
        setError('Respuesta inválida del servidor')
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/zaiken.png" alt="Zaiken" className="h-16 w-16 mx-auto mb-4 rounded-full shadow" />
          <h1 className="text-2xl font-bold text-gray-900">Sistema Zaiken</h1>
        </div>
        <form onSubmit={onSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Iniciar sesión</h2>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white rounded-lg py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          <div className="text-center text-sm text-gray-600">
            ¿No tienes cuenta? <a href="/register" className="text-indigo-600 hover:underline font-medium">Crear cuenta</a>
          </div>
        </form>
      </div>
    </div>
  )
}


