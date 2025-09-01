'use client'

import { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { UsuariosService, type Usuario } from '@/services/usuarios.service'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<{ id?: number; email: string; nombre: string; rol: 'ADMIN'|'USER'; password?: string; activo: boolean }>({
    email: '', nombre: '', rol: 'USER', password: '', activo: true
  })

  const isEdit = useMemo(()=> typeof form.id === 'number', [form.id])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await UsuariosService.list()
      setUsuarios(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEdit) {
        await UsuariosService.update(form.id!, { email: form.email, nombre: form.nombre, rol: form.rol, password: form.password || undefined, activo: form.activo })
      } else {
        await UsuariosService.create({ email: form.email, nombre: form.nombre, rol: form.rol, password: form.password || '' , activo: form.activo })
      }
      setForm({ email:'', nombre:'', rol:'USER', password:'', activo:true })
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const onEdit = (u: Usuario) => setForm({ id: u.id, email: u.email, nombre: u.nombre, rol: u.rol, activo: u.activo })
  const onDelete = async (id: number) => { if (confirm('¿Eliminar usuario?')) { await UsuariosService.remove(id); await load() } }

  return (
    <MainLayout>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-semibold">Gestión de Usuarios</h1>
        {error && <div className="text-red-600">{error}</div>}

        <form onSubmit={onSubmit} className="bg-white rounded shadow p-4 grid grid-cols-1 md:grid-cols-6 gap-4">
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required />
          <input type="email" className="border rounded px-3 py-2 md:col-span-2" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          <select className="border rounded px-3 py-2" value={form.rol} onChange={e=>setForm({...form, rol: e.target.value as any})}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <input type="password" className="border rounded px-3 py-2 md:col-span-2" placeholder="Contraseña" value={form.password || ''} onChange={e=>setForm({...form, password:e.target.value})} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.activo} onChange={e=>setForm({...form, activo:e.target.checked})} /> Activo
          </label>
          <button className="bg-blue-600 text-white rounded px-4 py-2" type="submit">{isEdit? 'Actualizar' : 'Crear'}</button>
          {isEdit && <button className="bg-gray-500 text-white rounded px-4 py-2" onClick={(e)=>{e.preventDefault(); setForm({ email:'', nombre:'', rol:'USER', password:'', activo:true })}}>Cancelar</button>}
        </form>

        <div className="bg-white rounded shadow">
          {loading ? (
            <div className="p-4">Cargando...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Rol</th>
                  <th className="text-left p-2">Activo</th>
                  <th className="text-left p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u=> (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.id}</td>
                    <td className="p-2">{u.nombre}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.rol}</td>
                    <td className="p-2">{u.activo? 'Sí':'No'}</td>
                    <td className="p-2 space-x-2">
                      <button className="text-blue-600" onClick={()=>onEdit(u)}>Editar</button>
                      <button className="text-red-600" onClick={()=>onDelete(u.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  )
}



