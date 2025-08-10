'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

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
                href="/personas"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive('/personas')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-people-fill"></i>
                <span>Personas</span>
              </Link>
            </li>
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

        <div>
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
      </nav>
    </aside>
  )
}
