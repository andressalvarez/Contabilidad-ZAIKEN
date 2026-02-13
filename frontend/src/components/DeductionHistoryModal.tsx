'use client';

import { X, Clock, Calendar, TrendingDown, FileText, CheckCircle, Calculator, ArrowRight, Zap, BarChart, AlertCircle } from 'lucide-react';
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

  // Daily threshold (from backend default or config)
  const DAILY_THRESHOLD_HOURS = 8;

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

  // Convert minutes to decimal hours
  const minutesToDecimal = (minutes: number) => {
    return (minutes / 60).toFixed(2);
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
              <div className="relative inline-block mb-6">
                <Clock className="h-16 w-16 text-gray-300 mx-auto" />
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-100 rounded-full">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Esta deuda aún no tiene pagos registrados
              </h3>
              <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-900 mb-2 font-medium">
                  ¿Cómo se pagan las deudas automáticamente?
                </p>
                <ul className="text-sm text-blue-800 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">1.</span>
                    <span>Cuando trabajas más de <strong>{DAILY_THRESHOLD_HOURS} horas</strong> en un día</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">2.</span>
                    <span>El <strong>exceso</strong> se calcula automáticamente (horas trabajadas - {DAILY_THRESHOLD_HOURS}h)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">3.</span>
                    <span>Ese exceso se descuenta de tus <strong>deudas más antiguas</strong> primero (FIFO)</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Timeline of Deductions */}
          {!isLoading && !error && deductions && deductions.length > 0 && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">
                      Sistema de Pagos Automáticos - Trazabilidad Completa
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-800">
                      <div className="flex items-start gap-2 bg-white/60 rounded-lg p-2">
                        <Calculator className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold mb-0.5">Cálculo del exceso</p>
                          <p className="text-blue-700">Horas trabajadas - {DAILY_THRESHOLD_HOURS}h umbral = Exceso</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-white/60 rounded-lg p-2">
                        <TrendingDown className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold mb-0.5">Aplicación FIFO</p>
                          <p className="text-blue-700">El exceso paga las deudas más antiguas primero</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2 italic">
                      Cada pago muestra el origen exacto, cálculo detallado y distribución de horas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Deduction cards */}
              <div className="space-y-4">
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

                  // Calculate excess breakdown
                  const totalWorkedMinutes = (registro?.horas || 0) * 60;
                  const thresholdMinutes = DAILY_THRESHOLD_HOURS * 60;
                  const calculatedExcess = Math.max(0, totalWorkedMinutes - thresholdMinutes);
                  const excessUsedForThisDebt = deduction.minutesDeducted;
                  const excessUsedForOtherDebts = deduction.excessMinutes - deduction.minutesDeducted;

                  // Calculate percentage for visual bar
                  const thresholdPercentage = totalWorkedMinutes > 0
                    ? Math.min(100, (thresholdMinutes / totalWorkedMinutes) * 100)
                    : 0;
                  const excessPercentage = totalWorkedMinutes > 0
                    ? ((calculatedExcess / totalWorkedMinutes) * 100)
                    : 0;

                  return (
                    <div
                      key={deduction.id}
                      className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-indigo-300"
                    >
                      <div className="flex items-start gap-4">
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-md">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          {index < deductions.length - 1 && (
                            <div className="w-0.5 h-full bg-gradient-to-b from-gray-300 to-gray-100 mt-3"></div>
                          )}
                        </div>

                        {/* Deduction details */}
                        <div className="flex-1 min-w-0">
                          {/* Header with payment date */}
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">{date}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                              <FileText className="h-3.5 w-3.5" />
                              <span className="font-semibold">Registro #{deduction.registroHorasId}</span>
                            </div>
                          </div>

                          {/* Work date banner */}
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg px-4 py-2.5 mb-4">
                            <p className="text-sm">
                              <span className="text-indigo-600 font-medium">Día trabajado:</span>
                              {' '}
                              <span className="text-indigo-900 font-bold">{workDate}</span>
                              {registro?.timerInicio && registro?.timerFin && (
                                <span className="text-indigo-700 ml-2 font-mono text-xs">
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
                            </p>
                          </div>

                          {/* CALCULATION BREAKDOWN - THE VALUABLE PART */}
                          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Calculator className="h-4 w-4 text-amber-700" />
                              <h4 className="text-sm font-bold text-amber-900">Cálculo del Exceso</h4>
                            </div>

                            {/* Formula display */}
                            <div className="bg-white/80 rounded-lg p-3 mb-3 font-mono text-sm">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded font-bold">
                                  {minutesToHours(totalWorkedMinutes)}
                                </span>
                                <span className="text-gray-500">−</span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded font-bold">
                                  {DAILY_THRESHOLD_HOURS}h umbral
                                </span>
                                <span className="text-gray-500">=</span>
                                <span className="px-2 py-1 bg-green-100 text-green-900 rounded font-bold">
                                  {minutesToHours(calculatedExcess)} exceso
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-2">
                                Trabajaste <strong className="text-blue-700">{minutesToDecimal(totalWorkedMinutes)}h</strong>,
                                el umbral diario es <strong className="text-gray-700">{DAILY_THRESHOLD_HOURS}h</strong>,
                                generando <strong className="text-green-700">{minutesToDecimal(calculatedExcess)}h</strong> de exceso
                              </p>
                            </div>

                            {/* Visual progress bar */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-gray-600 font-medium">Distribución de horas trabajadas</span>
                                <span className="text-gray-900 font-bold">{minutesToHours(totalWorkedMinutes)} total</span>
                              </div>
                              <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex border border-gray-200">
                                {/* Threshold portion */}
                                <div
                                  className="bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center text-xs font-bold text-gray-800 transition-all"
                                  style={{ width: `${thresholdPercentage}%` }}
                                  title={`Umbral: ${DAILY_THRESHOLD_HOURS}h`}
                                >
                                  {thresholdPercentage > 15 && (
                                    <span className="px-2">{DAILY_THRESHOLD_HOURS}h</span>
                                  )}
                                </div>
                                {/* Excess portion */}
                                <div
                                  className="bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-xs font-bold text-white transition-all"
                                  style={{ width: `${excessPercentage}%` }}
                                  title={`Exceso: ${minutesToHours(calculatedExcess)}`}
                                >
                                  {excessPercentage > 15 && (
                                    <span className="px-2 flex items-center gap-1">
                                      <Zap className="h-3 w-3" />
                                      {minutesToHours(calculatedExcess)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs mt-1.5">
                                <span className="text-gray-500">
                                  <span className="inline-block w-2 h-2 bg-gray-400 rounded mr-1"></span>
                                  Trabajo normal
                                </span>
                                <span className="text-green-700 font-medium">
                                  <span className="inline-block w-2 h-2 bg-green-500 rounded mr-1"></span>
                                  Exceso aplicado
                                </span>
                              </div>
                            </div>

                            {/* Excess distribution */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-green-100 border border-green-300 rounded-lg p-2.5">
                                <p className="text-xs text-green-700 font-medium mb-0.5">Deducido de esta deuda</p>
                                <p className="text-lg font-bold text-green-900">{minutesToHours(excessUsedForThisDebt)}</p>
                              </div>
                              {excessUsedForOtherDebts > 0 && (
                                <div className="bg-blue-100 border border-blue-300 rounded-lg p-2.5">
                                  <p className="text-xs text-blue-700 font-medium mb-0.5">Aplicado a otras deudas</p>
                                  <p className="text-lg font-bold text-blue-900">{minutesToHours(excessUsedForOtherDebts)}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Summary badge */}
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                            <TrendingDown className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-green-900">
                                <span className="font-semibold">Reducción aplicada:</span>
                                {' '}
                                <span className="text-xl font-bold">{minutesToHours(deduction.minutesDeducted)}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-700" />
                  </div>
                  <h4 className="text-base font-bold text-green-900">Resumen de Pagos</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/80 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">Total Deducido</p>
                    <p className="text-2xl font-bold text-green-900">
                      {minutesToHours(
                        deductions.reduce((sum, d) => sum + d.minutesDeducted, 0)
                      )}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      ({minutesToDecimal(deductions.reduce((sum, d) => sum + d.minutesDeducted, 0))} horas decimales)
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">Número de Pagos</p>
                    <p className="text-2xl font-bold text-green-900">{deductions.length}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Registros que pagaron
                    </p>
                  </div>
                  <div className="col-span-2 bg-white/80 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-1">Exceso Total Generado</p>
                    <p className="text-xl font-bold text-blue-900">
                      {minutesToHours(
                        deductions.reduce((sum, d) => sum + d.excessMinutes, 0)
                      )}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      De los cuales{' '}
                      <strong className="text-green-700">
                        {minutesToHours(deductions.reduce((sum, d) => sum + d.minutesDeducted, 0))}
                      </strong>
                      {' '}se aplicaron a esta deuda
                      {deductions.reduce((sum, d) => sum + d.excessMinutes, 0) >
                       deductions.reduce((sum, d) => sum + d.minutesDeducted, 0) && (
                        <span>
                          {' '}y{' '}
                          <strong className="text-blue-700">
                            {minutesToHours(
                              deductions.reduce((sum, d) => sum + d.excessMinutes - d.minutesDeducted, 0)
                            )}
                          </strong>
                          {' '}a otras deudas
                        </span>
                      )}
                    </p>
                  </div>
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
