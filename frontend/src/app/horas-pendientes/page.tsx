'use client';

import { useEffect, useMemo, useState } from 'react';
import { RegistroHorasService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Check, X, Clock, AlertCircle, RefreshCw, User, Calendar, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { RegistroHoras } from '@/types';
import { useCan } from '@/components/Can';
import { Action } from '@/contexts/AbilityContext';
import { showConfirm } from '@/lib/app-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { timeRecordKeys } from '@/hooks/useRegistroHoras';
import { getTodayLocal } from '@/utils/fechas';

type DateMode = 'today' | 'selected' | 'week' | 'month' | 'all';

function toLocalDate(value?: string | Date | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isInCurrentWeek(value?: string | Date | null): boolean {
  if (!value) return false;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - mondayOffset);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

function isInCurrentMonth(value?: string | Date | null): boolean {
  if (!value) return false;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function HorasPendientesPage() {
  const queryClient = useQueryClient();
  const [pendingRecords, setPendingRecords] = useState<RegistroHoras[]>([]);
  const [rejectedRecords, setRejectedRecords] = useState<RegistroHoras[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [dateMode, setDateMode] = useState<DateMode>('today');
  const [dateFilter, setDateFilter] = useState(getTodayLocal());
  const [userFilter, setUserFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const canApprove = useCan(Action.Approve, 'RegistroHoras');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, rejected] = await Promise.all([
        RegistroHorasService.getPending(),
        RegistroHorasService.getRejected(),
      ]);
      setPendingRecords(pending);
      setRejectedRecords(rejected);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Aprobar registro',
      message: 'Estas seguro de aprobar este registro de horas?',
      confirmText: 'Aprobar',
    });
    if (!confirmed) return;

    try {
      await RegistroHorasService.approve(id);
      toast.success('Registro aprobado exitosamente');
      await Promise.all([
        loadData(),
        queryClient.invalidateQueries({ queryKey: timeRecordKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['hour-debt'] }),
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Error al aprobar registro';
      toast.error(message);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      toast.error('Debe ingresar un motivo de rechazo');
      return;
    }

    try {
      await RegistroHorasService.reject(id, rejectReason);
      toast.success('Registro rechazado');
      setRejectingId(null);
      setRejectReason('');
      await Promise.all([
        loadData(),
        queryClient.invalidateQueries({ queryKey: timeRecordKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['hour-debt'] }),
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Error al rechazar registro';
      toast.error(message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const userOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const record of [...pendingRecords, ...rejectedRecords]) {
      if (!record.usuarioId) continue;
      if (!map.has(record.usuarioId)) {
        map.set(record.usuarioId, record.usuario?.nombre || `Usuario #${record.usuarioId}`);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [pendingRecords, rejectedRecords]);

  const matchesDateFilter = (record: RegistroHoras): boolean => {
    const recordDate = toLocalDate(record.fecha);
    if (!recordDate) return false;

    if (dateMode === 'all') return true;
    if (dateMode === 'today') return recordDate === getTodayLocal();
    if (dateMode === 'selected') return !dateFilter || recordDate === dateFilter;
    if (dateMode === 'week') return isInCurrentWeek(record.fecha);
    if (dateMode === 'month') return isInCurrentMonth(record.fecha);
    return true;
  };

  const matchesUserFilter = (record: RegistroHoras): boolean => {
    if (userFilter === 'all') return true;
    return String(record.usuarioId) === userFilter;
  };

  const matchesSearchFilter = (record: RegistroHoras): boolean => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;

    const searchable = [
      record.usuario?.nombre || '',
      record.descripcion || '',
      record.motivoRechazo || '',
      record.campana?.nombre || '',
      String(record.horas || ''),
      toLocalDate(record.fecha),
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(q);
  };

  const visiblePending = pendingRecords.filter(
    (record) =>
      matchesDateFilter(record) &&
      matchesUserFilter(record) &&
      matchesSearchFilter(record),
  );

  const visibleRejected = rejectedRecords.filter(
    (record) =>
      matchesDateFilter(record) &&
      matchesUserFilter(record) &&
      matchesSearchFilter(record),
  );

  if (!canApprove) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4 sm:p-8 text-center">
          <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-900">Acceso Denegado</h1>
          <p className="text-gray-600 text-sm sm:text-base">No tienes permisos para aprobar registros de horas.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Aprobacion de horas</h1>
                <p className="text-gray-600 text-xs sm:text-sm">Revisa el rango real, la fecha de creacion y la nota antes de aprobar</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full sm:w-auto">
              <select
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value as DateMode)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px]"
              >
                <option value="today">Hoy</option>
                <option value="selected">Dia especifico</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="all">Todo el tiempo</option>
              </select>

              {dateMode === 'selected' ? (
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] w-full"
                />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 min-h-[44px]">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {dateMode === 'today' && 'Filtrando por hoy'}
                    {dateMode === 'week' && 'Filtrando por esta semana'}
                    {dateMode === 'month' && 'Filtrando por este mes'}
                    {dateMode === 'all' && 'Sin filtro de fecha'}
                  </span>
                </div>
              )}

              <div className="relative">
                <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] w-full"
                >
                  <option value="all">Todos los usuarios</option>
                  {userOptions.map(([id, name]) => (
                    <option key={id} value={String(id)}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Pendientes ({visiblePending.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors ${
                activeTab === 'rejected'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Rechazados ({visibleRejected.length})
            </button>
          </div>

          {loading && (
            <div className="text-center py-8 sm:py-12">
              <RefreshCw className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto animate-spin" />
              <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">Cargando registros...</p>
            </div>
          )}

          {!loading && activeTab === 'pending' && (
            <div className="p-4 sm:p-6">
              {visiblePending.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-600 text-sm sm:text-base">No hay registros pendientes para la fecha seleccionada</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {visiblePending.map((record) => (
                    <div key={record.id} className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-indigo-100 rounded">
                                <User className="h-3.5 w-3.5 text-indigo-600" />
                              </div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                {record.usuario?.nombre || `Usuario #${record.usuarioId}`}
                              </h3>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-blue-600 font-mono">
                              {formatHours(record.horas)}
                            </span>
                          </div>

                          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-green-50 p-2 sm:p-3 mb-2 sm:mb-3">
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 sm:items-center">
                              <div className="rounded-lg bg-white/90 border border-blue-100 px-3 py-2 shadow-sm">
                                <p className="text-[11px] uppercase tracking-wide text-blue-700 font-semibold">Desde</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDateTime(record.timerInicio)}</p>
                              </div>
                              <div className="hidden sm:flex items-center justify-center text-blue-400">
                                <Clock className="h-4 w-4" />
                              </div>
                              <div className="rounded-lg bg-white/90 border border-green-100 px-3 py-2 shadow-sm">
                                <p className="text-[11px] uppercase tracking-wide text-green-700 font-semibold">Hasta</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDateTime(record.timerFin)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                            {record.campana && (
                              <div><span className="font-medium">Campana:</span> {record.campana.nombre}</div>
                            )}
                            <div>
                              <span className="font-medium">Origen:</span> {record.origen === 'TIMER' ? 'Timer' : 'Manual'}
                            </div>
                          </div>

                          {record.descripcion && (
                            <p className="mt-2 sm:mt-3 text-gray-700 text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-lg">
                              <span className="font-medium">Nota:</span> {record.descripcion}
                            </p>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          {rejectingId === record.id ? (
                            <div className="flex flex-col gap-2 w-full lg:w-64">
                              <input
                                type="text"
                                placeholder="Motivo del rechazo..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[44px]"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReject(record.id)}
                                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectReason('');
                                  }}
                                  className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(record.id)}
                                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                              >
                                <Check className="h-4 w-4" />
                                <span className="hidden sm:inline">Aprobar</span>
                              </button>
                              <button
                                onClick={() => setRejectingId(record.id)}
                                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                              >
                                <X className="h-4 w-4" />
                                <span className="hidden sm:inline">Rechazar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 sm:mt-3 text-[11px] text-gray-500 text-right">
                        <span className="uppercase tracking-wide font-semibold">Creado:</span>{' '}
                        <span className="font-medium">{formatDateTime(record.createdAt)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'rejected' && (
            <div className="p-4 sm:p-6">
              {visibleRejected.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-600 text-sm sm:text-base">No hay registros rechazados para la fecha seleccionada</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {visibleRejected.map((record) => (
                    <div key={record.id} className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                      <div className="mb-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-red-100 rounded">
                              <User className="h-3.5 w-3.5 text-red-600" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {record.usuario?.nombre || `Usuario #${record.usuarioId}`}
                            </h3>
                          </div>
                          <span className="text-lg sm:text-xl font-bold text-red-600 font-mono">
                            {formatHours(record.horas)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 mb-3">
                          <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Creado</p>
                            <p className="text-sm font-semibold text-gray-900">{formatDateTime(record.createdAt)}</p>
                          </div>
                          <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-red-700 font-semibold">Desde</p>
                            <p className="text-sm font-semibold text-gray-900">{formatDateTime(record.timerInicio)}</p>
                          </div>
                          <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-red-700 font-semibold">Hasta</p>
                            <p className="text-sm font-semibold text-gray-900">{formatDateTime(record.timerFin)}</p>
                          </div>
                        </div>

                        <div className="text-xs sm:text-sm text-gray-600 mb-1">
                          <span className="font-medium">Fecha:</span> {formatDate(record.fecha)}
                        </div>
                      </div>

                      {record.descripcion && (
                        <p className="mb-3 text-gray-700 text-xs sm:text-sm">
                          <span className="font-medium">Nota:</span> {record.descripcion}
                        </p>
                      )}

                      <div className="bg-red-100 p-3 rounded-lg">
                        <span className="text-red-700 font-semibold text-xs sm:text-sm">Motivo de rechazo:</span>
                        <p className="text-red-800 text-xs sm:text-sm mt-1">{record.motivoRechazo || 'No especificado'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

