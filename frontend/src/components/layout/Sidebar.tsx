'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { useRegistroHoras } from '@/hooks/useRegistroHoras'
import { useCan } from '@/hooks/usePermissions'
import { Action } from '@/types/permissions'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: registrosHoras = [] } = useRegistroHoras()
  const canApprove = useCan(Action.Approve, 'RegistroHoras')
  const canManageDebt = useCan(Action.Manage, 'HourDebt')
  const canReadDebt = useCan(Action.Read, 'HourDebt')
  const canManageSettings = useCan(Action.Manage, 'Settings')

  // Count hours pending approval
  const pendingCount = registrosHoras.filter(
    (r) => !r.aprobado && !r.rechazado
  ).length

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <aside className="w-64 h-screen sticky top-0 overflow-y-auto bg-white border-r border-gray-200">
      <nav className="p-4">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Principal</h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-grid-1x2-fill"></i>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/estadisticas"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/estadisticas')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-bar-chart-fill"></i>
                <span>Estadísticas</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Gestión de Personal</h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/roles"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/roles')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-person-badge-fill"></i>
                <span>Roles</span>
              </Link>
            </li>
            <li>
              <Link
                href="/valor-hora"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/valor-hora')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-clock-fill"></i>
                <span>Valor Hora</span>
              </Link>
            </li>
            <li>
              <Link
                href="/registro-horas"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/registro-horas')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-calendar2-check-fill"></i>
                <span>Registro Horas</span>
              </Link>
            </li>
            {canApprove && (
              <li>
                <Link
                  href="/horas-pendientes"
                  className={`flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                    isActive('/horas-pendientes')
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-gray-700 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className="bi bi-clock-history"></i>
                    <span>Aprobar Horas</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </li>
            )}
            {(canManageDebt || canReadDebt) && (
              <li>
                <Link
                  href="/deuda-horas"
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                    isActive('/deuda-horas')
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-hourglass-split"></i>
                  <span>Deuda de Horas</span>
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Operaciones</h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/gastos"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/gastos')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-receipt"></i>
                <span>Gastos</span>
              </Link>
            </li>
            <li>
              <Link
                href="/transacciones"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/transacciones')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-wallet2"></i>
                <span>Transacciones</span>
              </Link>
            </li>
            <li>
              <Link
                href="/tipos-transaccion"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/tipos-transaccion')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-credit-card-fill"></i>
                <span>Tipos de Transacción</span>
              </Link>
            </li>
            <li>
              <Link
                href="/categorias"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/categorias')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-tags-fill"></i>
                <span>Categorías</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Distribución</h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/distribucion-utilidades"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/distribucion-utilidades')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-pie-chart-fill"></i>
                <span>Distribución Utilidades</span>
              </Link>
            </li>
            <li>
              <Link
                href="/distribucion-detalle"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/distribucion-detalle')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-list-check"></i>
                <span>Distribución Detalle</span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Administración</h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/usuarios"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/usuarios')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-person-gear"></i>
                <span>Usuarios</span>
              </Link>
            </li>
            {canManageSettings && (
              <li>
                <Link
                  href="/configuracion"
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                    isActive('/configuracion')
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </aside>
  )
}
