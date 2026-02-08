'use client';

import { useState, useEffect } from 'react';
import { RegistroHorasService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Check, X, Clock, AlertCircle, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import { RegistroHoras } from '@/types';
import { useCan } from '@/components/Can';
import { Action } from '@/contexts/AbilityContext';

export default function HorasPendientesPage() {
  const [pendingRecords, setPendingRecords] = useState<RegistroHoras[]>([]);
  const [rejectedRecords, setRejectedRecords] = useState<RegistroHoras[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const canApprove = useCan(Action.Approve, 'RegistroHoras');

  // Load data
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

  // Approve record
  const handleApprove = async (id: number) => {
    if (!confirm('¿Está seguro de aprobar este registro de horas?')) {
      return;
    }

    try {
      await RegistroHorasService.approve(id);
      toast.success('Registro aprobado exitosamente');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar registro');
    }
  };

  // Reject record
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
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar registro');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format hours
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Format time range
  const formatTimeRange = (startTime: string | null | undefined, endTime: string | null | undefined) => {
    if (!startTime || !endTime) return null;

    const start = new Date(startTime);
    const end = new Date(endTime);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  if (!canApprove) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4 sm:p-8 text-center">
          <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-900">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            No tienes permisos para aprobar registros de horas.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Aprobación de Horas
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Revisa y aprueba los registros de horas de tu equipo
                </p>
              </div>
            </div>
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

        {/* Tabs */}
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
              Pendientes ({pendingRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors ${
                activeTab === 'rejected'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Rechazados ({rejectedRecords.length})
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8 sm:py-12">
              <RefreshCw className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto animate-spin" />
              <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">Cargando registros...</p>
            </div>
          )}

          {/* Registros Pendientes */}
          {!loading && activeTab === 'pending' && (
            <div className="p-4 sm:p-6">
              {pendingRecords.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-600 text-sm sm:text-base">No hay registros pendientes de aprobación</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {pendingRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Información */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-indigo-100 rounded">
                                <User className="h-3.5 w-3.5 text-indigo-600" />
                              </div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                {record.usuario?.nombre || 'Usuario desconocido'}
                              </h3>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-blue-600 font-mono">
                              {formatHours(record.horas)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Fecha:</span> {formatDate(record.fecha)}
                            </div>
                            {record.origen === 'TIMER' && formatTimeRange(record.timerInicio, record.timerFin) && (
                              <div className="text-blue-600 font-medium flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formatTimeRange(record.timerInicio, record.timerFin)}</span>
                              </div>
                            )}
                            {record.campana && (
                              <div>
                                <span className="font-medium">Campaña:</span> {record.campana.nombre}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Origen:</span>{' '}
                              {record.origen === 'TIMER' ? 'Timer automático' : 'Manual'}
                            </div>
                          </div>

                          {record.descripcion && (
                            <p className="mt-2 sm:mt-3 text-gray-700 text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-lg">
                              {record.descripcion}
                            </p>
                          )}
                        </div>

                        {/* Acciones */}
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Registros Rechazados */}
          {!loading && activeTab === 'rejected' && (
            <div className="p-4 sm:p-6">
              {rejectedRecords.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-600 text-sm sm:text-base">No hay registros rechazados</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {rejectedRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-5"
                    >
                      <div className="mb-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-red-100 rounded">
                              <User className="h-3.5 w-3.5 text-red-600" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {record.usuario?.nombre || 'Usuario desconocido'}
                            </h3>
                          </div>
                          <span className="text-lg sm:text-xl font-bold text-red-600 font-mono">
                            {formatHours(record.horas)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Fecha:</span> {formatDate(record.fecha)}
                          </div>
                          {record.origen === 'TIMER' && formatTimeRange(record.timerInicio, record.timerFin) && (
                            <div className="text-red-600 font-medium flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatTimeRange(record.timerInicio, record.timerFin)}</span>
                            </div>
                          )}
                          {record.campana && (
                            <div>
                              <span className="font-medium">Campaña:</span> {record.campana.nombre}
                            </div>
                          )}
                        </div>
                      </div>

                      {record.descripcion && (
                        <p className="mb-3 text-gray-700 text-xs sm:text-sm">
                          {record.descripcion}
                        </p>
                      )}

                      <div className="bg-red-100 p-3 rounded-lg">
                        <span className="text-red-700 font-semibold text-xs sm:text-sm">
                          Motivo de rechazo:
                        </span>
                        <p className="text-red-800 text-xs sm:text-sm mt-1">
                          {record.motivoRechazo || 'No especificado'}
                        </p>
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
