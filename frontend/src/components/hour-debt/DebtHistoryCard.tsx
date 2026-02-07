'use client';

import { Calendar, TrendingDown, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useMyHistory } from '@/hooks/useHourDebt';
import HourDebtService, { HourDebt, DebtStatus } from '@/services/hourDebt.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DebtHistoryCard() {
  const { data: debts, isLoading } = useMyHistory();
  const [expandedDebtId, setExpandedDebtId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Calendar className="text-indigo-600" size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Deudas
          </h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!debts || debts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Deudas
          </h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin deudas registradas
          </h3>
          <p className="text-gray-600">
            No tienes deudas de horas en tu historial
          </p>
        </div>
      </div>
    );
  }

  const activeDebts = debts.filter((d) => d.status === DebtStatus.ACTIVE);
  const paidDebts = debts.filter((d) => d.status === DebtStatus.FULLY_PAID);
  const cancelledDebts = debts.filter((d) => d.status === DebtStatus.CANCELLED);

  const toggleExpand = (debtId: number) => {
    setExpandedDebtId(expandedDebtId === debtId ? null : debtId);
  };

  const renderDebt = (debt: HourDebt) => {
    const isExpanded = expandedDebtId === debt.id;
    const hasDeductions = debt.deductions && debt.deductions.length > 0;

    return (
      <motion.div
        key={debt.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-lg p-4 ${
          debt.status === DebtStatus.ACTIVE
            ? 'border-amber-200 bg-amber-50'
            : debt.status === DebtStatus.FULLY_PAID
            ? 'border-green-200 bg-green-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`p-2 rounded-lg ${
                debt.status === DebtStatus.ACTIVE
                  ? 'bg-amber-100'
                  : debt.status === DebtStatus.FULLY_PAID
                  ? 'bg-green-100'
                  : 'bg-gray-100'
              }`}
            >
              <Calendar
                className={
                  debt.status === DebtStatus.ACTIVE
                    ? 'text-amber-600'
                    : debt.status === DebtStatus.FULLY_PAID
                    ? 'text-green-600'
                    : 'text-gray-600'
                }
                size={16}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">
                  {format(new Date(debt.date), 'dd MMMM yyyy', { locale: es })}
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    debt.status === DebtStatus.ACTIVE
                      ? 'bg-amber-200 text-amber-800'
                      : debt.status === DebtStatus.FULLY_PAID
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {debt.status === DebtStatus.ACTIVE && <AlertCircle className="h-3 w-3" />}
                  {debt.status === DebtStatus.FULLY_PAID && <CheckCircle className="h-3 w-3" />}
                  {debt.status === DebtStatus.ACTIVE
                    ? 'Activa'
                    : debt.status === DebtStatus.FULLY_PAID
                    ? 'Pagada'
                    : 'Cancelada'}
                </span>
              </div>

              {debt.reason && (
                <p className="text-sm text-gray-600 mt-1">{debt.reason}</p>
              )}

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Adeudado:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {HourDebtService.minutesToHoursString(debt.minutesOwed)}
                  </span>
                </div>
                {debt.status === DebtStatus.ACTIVE && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-amber-600">Pendiente:</span>
                      <span className="text-sm font-semibold text-amber-900">
                        {HourDebtService.minutesToHoursString(debt.remainingMinutes)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {hasDeductions && (
            <button
              onClick={() => toggleExpand(debt.id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
        </div>

        {/* Deductions */}
        <AnimatePresence>
          {isExpanded && hasDeductions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-gray-200 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-medium text-gray-700">
                  Deducciones ({debt.deductions?.length})
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {debt.deductions?.map((deduction) => (
                  <div
                    key={deduction.id}
                    className="bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {format(
                            new Date(deduction.deductedAt),
                            'dd MMM yyyy - HH:mm',
                            { locale: es }
                          )}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        -{HourDebtService.minutesToHoursString(deduction.minutesDeducted)}
                      </span>
                    </div>
                    {deduction.excessMinutes > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Exceso de trabajo: {HourDebtService.minutesToHoursString(deduction.excessMinutes)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Calendar className="text-indigo-600" size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Deudas
          </h3>
        </div>

        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            {activeDebts.length} Activas
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {paidDebts.length} Pagadas
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {/* Active debts first */}
        {activeDebts.map(renderDebt)}

        {/* Then paid debts */}
        {paidDebts.map(renderDebt)}

        {/* Finally cancelled debts */}
        {cancelledDebts.map(renderDebt)}
      </div>
    </div>
  );
}
