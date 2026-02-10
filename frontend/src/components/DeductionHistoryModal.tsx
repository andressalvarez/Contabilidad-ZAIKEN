'use client';

import { X, Clock, Calendar, TrendingDown, FileText, CheckCircle } from 'lucide-react';
import { useDeductionHistory } from '@/hooks/useHourDebt';

interface DeductionHistoryModalProps {
  debtId: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal displaying the deduction/payment history for a specific debt
 * Shows a timeline of all deductions with details about work records that paid the debt
 */
export default function DeductionHistoryModal({
  debtId,
  isOpen,
  onClose,
}: DeductionHistoryModalProps) {
  const { data: deductions, isLoading, error } = useDeductionHistory(debtId);

  // Don't render if modal is not open
  if (!isOpen) return null;

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  // Convert minutes to readable format
  const minutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingDown className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Historial de Pagos
              </h3>
              <p className="text-sm text-gray-600">Deuda #{debtId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando historial...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <X className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error</h3>
                <p className="text-red-600 mt-1">
                  No se pudo cargar el historial de pagos
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && deductions && deductions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin deducciones
              </h3>
              <p className="text-gray-600">
                Esta deuda aún no tiene pagos registrados
              </p>
            </div>
          )}

          {/* Timeline of Deductions */}
          {!isLoading && !error && deductions && deductions.length > 0 && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    Timeline de Pagos
                  </h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Las horas trabajadas por encima del umbral diario se deducen
                    automáticamente de tu deuda más antigua (FIFO).
                  </p>
                </div>
              </div>

              {/* Deduction cards */}
              <div className="space-y-3">
                {deductions.map((deduction, index) => {
                  const { date, time } = formatDateTime(deduction.deductedAt);
                  const registro = deduction.registroHoras;
                  const workDate = registro?.fecha
                    ? new Date(registro.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })
                    : 'Fecha desconocida';

                  return (
                    <div
                      key={deduction.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Timeline indicator and info */}
                        <div className="flex gap-3 flex-1">
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center">
                            <div className="p-1.5 bg-green-100 rounded-full">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            {index < deductions.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                            )}
                          </div>

                          {/* Deduction details */}
                          <div className="flex-1">
                            {/* Payment date and time */}
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{date}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{time}</span>
                              </div>
                            </div>

                            {/* Record reference and work date */}
                            <div className="mb-3">
                              <p className="text-sm text-gray-700 mb-1">
                                <span className="font-medium text-gray-900">
                                  Registro de trabajo #{deduction.registroHorasId}
                                </span>
                                {' '}pagó parte de esta deuda
                              </p>
                              <p className="text-xs text-gray-600">
                                Tiempo extra trabajado el: <span className="font-medium text-indigo-600">{workDate}</span>
                              </p>
                            </div>

                            {/* Campaign if exists */}
                            {registro?.campana && (
                              <div className="bg-purple-50 border border-purple-200 rounded-md px-3 py-1.5 mb-2">
                                <p className="text-xs text-purple-700">
                                  Campaña: <span className="font-medium">{registro.campana.nombre}</span>
                                </p>
                              </div>
                            )}

                            {/* Description if exists */}
                            {registro?.descripcion && (
                              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 mb-2">
                                <p className="text-xs text-gray-700">
                                  <FileText className="h-3 w-3 inline mr-1" />
                                  {registro.descripcion}
                                </p>
                              </div>
                            )}

                            {/* Work hours and schedule */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-700">
                                  Total trabajado: <span className="font-semibold">{registro?.horas || 0}h</span>
                                </span>
                                {registro?.timerInicio && registro?.timerFin && (
                                  <span className="text-blue-600">
                                    {new Date(registro.timerInicio).toLocaleTimeString('es-ES', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                    {' → '}
                                    {new Date(registro.timerFin).toLocaleTimeString('es-ES', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Hours deducted */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-600">
                                Horas deducidas:
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <TrendingDown className="h-3 w-3" />
                                {minutesToHours(deduction.minutesDeducted)}
                              </span>
                            </div>

                            {/* Excess hours (if different from deducted) */}
                            {deduction.excessMinutes > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">
                                  Exceso total aplicado:
                                </span>
                                <span className="text-xs font-medium text-gray-700">
                                  {minutesToHours(deduction.excessMinutes)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total pagado:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {minutesToHours(
                      deductions.reduce(
                        (sum, d) => sum + d.minutesDeducted,
                        0
                      )
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">
                    Número de pagos:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {deductions.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
