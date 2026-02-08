'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Settings, LogOut, X, Shield, FileText } from 'lucide-react'
import { useRegistroHoras } from '@/hooks/useRegistroHoras'
import { useCan } from '@/hooks/usePermissions'
import { Action } from '@/types/permissions'
import { clearAuthToken } from '@/lib/auth'
import { useUser } from '@/hooks/useUser'
import { useSidebar } from '@/contexts/SidebarContext'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { data: registrosHoras = [] } = useRegistroHoras()
  const { isOpen, close } = useSidebar()

  const canReadDashboard = useCan(Action.Read, 'Dashboard')
  const canReadStats = useCan(Action.Read, 'Estadisticas')
  const canReadBusinessRoles = useCan(Action.Read, 'BusinessRole')
  const canReadValorHora = useCan(Action.Read, 'ValorHora')
  const canReadRegistroHoras = useCan(Action.Read, 'RegistroHoras')
  const canApprove = useCan(Action.Approve, 'RegistroHoras')
  const canManageDebt = useCan(Action.Manage, 'HourDebt')
  const canReadDebt = useCan(Action.Read, 'HourDebt')
  const canReadCampanas = useCan(Action.Read, 'Campana')
  const canReadTransacciones = useCan(Action.Read, 'Transaccion')
  const canReadCategorias = useCan(Action.Read, 'Categoria')
  const canReadDistribucionUtilidades = useCan(Action.Read, 'DistribucionUtilidades')
  const canReadDistribucionDetalle = useCan(Action.Read, 'DistribucionDetalle')
  const canReadUsers = useCan(Action.Read, 'Usuario')
  const canManageSettings = useCan(Action.Manage, 'Settings')
  const canManageSecurity = useCan(Action.Manage, 'SecurityRole')
  const canReadAudit = useCan(Action.Read, 'SecurityAuditLog')

  const showPersonal = canReadBusinessRoles || canReadValorHora || canReadRegistroHoras || canApprove || canManageDebt || canReadDebt
  const showOperations = canReadCampanas || canReadTransacciones || canReadCategorias
  const showDistribution = canReadDistribucionUtilidades || canReadDistribucionDetalle
  const showAdmin = canReadUsers || canManageSecurity || canReadAudit || canManageSettings

  const handleLogout = () => {
    clearAuthToken()
    router.push('/login')
  }

  const pendingCount = registrosHoras.filter(
    (r) => !r.aprobado && !r.rechazado && r.estado === 'COMPLETADO'
  ).length

  const isActive = (path: string) => pathname === path

  const NavigationContent = () => (
    <>
      {(canReadDashboard || canReadStats) && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Principal</h3>
          <ul className="space-y-1">
            {canReadDashboard && (
              <li>
                <Link
                  href="/"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-grid-1x2-fill"></i>
                  <span>Dashboard</span>
                </Link>
              </li>
            )}
            {canReadStats && (
              <li>
                <Link
                  href="/estadisticas"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/estadisticas') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-bar-chart-fill"></i>
                  <span>Estadisticas</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {showPersonal && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Gestion de Personal</h3>
          <ul className="space-y-1">
            {canReadBusinessRoles && (
              <li>
                <Link
                  href="/roles"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/roles') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-person-badge-fill"></i>
                  <span>Roles</span>
                </Link>
              </li>
            )}
            {canReadValorHora && (
              <li>
                <Link
                  href="/valor-hora"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/valor-hora') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-clock-fill"></i>
                  <span>Valor Hora</span>
                </Link>
              </li>
            )}
            {canReadRegistroHoras && (
              <li>
                <Link
                  href="/registro-horas"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/registro-horas') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-calendar2-check-fill"></i>
                  <span>Registro Horas</span>
                </Link>
              </li>
            )}
            {canApprove && (
              <li>
                <Link
                  href="/horas-pendientes"
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/horas-pendientes') ? 'text-amber-600 bg-amber-50' : 'text-gray-700 hover:bg-amber-50'
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
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/deuda-horas') ? 'text-amber-600 bg-amber-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-hourglass-split"></i>
                  <span>Deuda de Horas</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {showOperations && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Operaciones</h3>
          <ul className="space-y-1">
            {canReadCampanas && (
              <li>
                <Link
                  href="/campanas"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/campanas') || isActive('/gastos')
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-receipt"></i>
                  <span>Campañas</span>
                </Link>
              </li>
            )}
            {canReadTransacciones && (
              <>
                <li>
                  <Link
                    href="/transacciones"
                    className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive('/transacciones') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <i className="bi bi-wallet2"></i>
                    <span>Transacciones</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tipos-transaccion"
                    className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive('/tipos-transaccion') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <i className="bi bi-credit-card-fill"></i>
                    <span>Tipos de Transaccion</span>
                  </Link>
                </li>
              </>
            )}
            {canReadCategorias && (
              <li>
                <Link
                  href="/categorias"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/categorias') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-tags-fill"></i>
                  <span>Categorias</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {showDistribution && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Distribucion</h3>
          <ul className="space-y-1">
            {canReadDistribucionUtilidades && (
              <li>
                <Link
                  href="/distribucion-utilidades"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/distribucion-utilidades') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-pie-chart-fill"></i>
                  <span>Distribucion Utilidades</span>
                </Link>
              </li>
            )}
            {canReadDistribucionDetalle && (
              <li>
                <Link
                  href="/distribucion-detalle"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/distribucion-detalle') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-list-check"></i>
                  <span>Distribucion Detalle</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {showAdmin && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Administracion</h3>
          <ul className="space-y-1">
            {canReadUsers && (
              <li>
                <Link
                  href="/usuarios"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/usuarios') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-person-gear"></i>
                  <span>Usuarios</span>
                </Link>
              </li>
            )}
            {canManageSecurity && (
              <li>
                <Link
                  href="/admin/seguridad/roles"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/admin/seguridad/roles') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Roles y Permisos</span>
                </Link>
              </li>
            )}
            {canReadAudit && (
              <li>
                <Link
                  href="/admin/seguridad/auditoria"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/admin/seguridad/auditoria') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Auditoria</span>
                </Link>
              </li>
            )}
            {canManageSettings && (
              <li>
                <Link
                  href="/configuracion"
                  className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/configuracion') || isActive('/admin/seguridad/configuracion')
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Configuracion</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            <p className="text-xs text-gray-500">
              {user.negocioRoleName || user.rolNegocio?.nombreRol || 'Sin rol de negocio'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesion</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:block fixed left-0 top-14 sm:top-16 w-64 h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] bg-white border-r border-gray-200 z-30 overflow-y-auto">
        <nav className="p-4">
          <NavigationContent />
        </nav>
      </aside>

      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 w-72 h-full bg-white border-r border-gray-200 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src="/zaiken.png" alt="Logo" className="h-10 w-10 rounded-full shadow" />
            <h2 className="text-lg font-bold text-gray-900">ZAIKEN</h2>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 h-[calc(100vh-145px)] overflow-y-auto">
          <NavigationContent />
        </nav>
        <div className="border-t border-gray-200 p-3 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
