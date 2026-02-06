'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Activity,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTransaccionesStats, useTransaccionesRecientes } from '@/hooks/useTransacciones';
import { useUsuariosSummary } from '@/hooks/useUsuarios';
import { useRoles } from '@/hooks/useRoles';
import { useCategorias } from '@/hooks/useCategorias';

export default function DashboardPage() {
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showAmounts, setShowAmounts] = useState(true);

  // React Query hooks
  const { data: stats, isLoading: statsLoading } = useTransaccionesStats({ fechaInicio, fechaFin });
  const { data: usuariosSummary } = useUsuariosSummary();
  const { data: transaccionesRecientes } = useTransaccionesRecientes(5);
  const { data: roles } = useRoles();
  const { data: categorias } = useCategorias();

  const formatCurrency = (amount: number) => {
    if (!showAmounts) return '••••••';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-4 w-4" />;
    if (balance < 0) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h1>
                <p className="text-sm text-gray-600">Vista general del sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAmounts(!showAmounts)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={showAmounts ? 'Ocultar montos' : 'Mostrar montos'}
              >
                {showAmounts ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1"
                />
                <span>-</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Balance General */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Balance General</p>
                  <p className={`text-2xl font-bold ${getBalanceColor(stats.balance)}`}>
                    {formatCurrency(stats.balance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.periodoAnalizado.inicio} - {stats.periodoAnalizado.fin}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  stats.balance > 0 ? 'bg-green-100' : stats.balance < 0 ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {getBalanceIcon(stats.balance)}
                </div>
              </div>
            </div>

            {/* Total Ingresos */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ingresos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalIngresos)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Promedio: {formatCurrency(stats.promedioIngresos)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Gastos */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Gastos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.totalGastos)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Promedio: {formatCurrency(stats.promedioGastos)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>

            {/* Transacciones */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transacciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransacciones}</p>
                  <div className="flex items-center gap-4 text-xs mt-1">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {stats.transaccionesAprobadas}
                    </span>
                    <span className="flex items-center gap-1 text-yellow-600">
                      <AlertCircle className="h-3 w-3" />
                      {stats.transaccionesPendientes}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumen de Usuarios */}
          {usuariosSummary && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Personal</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Usuarios</span>
                  <span className="font-medium">{usuariosSummary.usuarios.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Participación</span>
                  <span className="font-medium">{usuariosSummary.totales.participacionTotal.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Horas Totales</span>
                  <span className="font-medium">{usuariosSummary.totales.horasTotales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Inversión</span>
                  <span className="font-medium">{formatCurrency(usuariosSummary.totales.inversionTotal)}</span>
                </div>
              </div>
              <Link
                href="/usuarios"
                className="block w-full mt-4 text-center text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Ver detalles →
              </Link>
            </div>
          )}

          {/* Módulos del Sistema */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Módulos</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Roles</span>
                <span className="font-medium">{roles?.length || 0} configurados</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Categorías</span>
                <span className="font-medium">{categorias?.length || 0} activas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usuarios</span>
                <span className="font-medium">{usuariosSummary?.usuarios.length || 0} registrados</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transacciones</span>
                <span className="font-medium">{stats?.totalTransacciones || 0} total</span>
              </div>
            </div>
          </div>

          {/* Transacciones Recientes */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            </div>
            <div className="space-y-3">
              {transaccionesRecientes?.slice(0, 5).map((transaccion) => (
                <div key={transaccion.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaccion.descripcion}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaccion.fecha)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      transaccion.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaccion.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(transaccion.monto)}
                    </span>
                    {!transaccion.aprobado && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Pendiente de aprobación" />
                    )}
                  </div>
                </div>
              ))}
              {(!transaccionesRecientes || transaccionesRecientes.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay transacciones recientes
                </p>
              )}
            </div>
            <Link
              href="/transacciones"
              className="block w-full mt-4 text-center text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Ver todas →
            </Link>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/transacciones?new=true"
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Nueva Transacción</span>
            </Link>
            <Link
              href="/usuarios?new=true"
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">Agregar Usuario</span>
            </Link>
            <Link
              href="/roles?new=true"
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Target className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Nuevo Rol</span>
            </Link>
            <Link
              href="/transacciones?pending=true"
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <span className="text-sm font-medium text-gray-900">Aprobar Transacciones</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
