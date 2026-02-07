'use client';

import { Clock, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react';
import { useMyBalance } from '@/hooks/useHourDebt';
import HourDebtService from '@/services/hourDebt.service';
import { motion } from 'framer-motion';

export default function HourDebtWidget() {
  const { data: balance, isLoading, error } = useMyBalance();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <Clock className="text-amber-600" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">Deuda de Horas</p>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded mt-1"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Deuda de Horas</p>
            <p className="text-sm text-red-600">Error al cargar</p>
          </div>
        </div>
      </div>
    );
  }

  const balanceMinutes = balance || 0;
  const hasDebt = balanceMinutes > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-lg border ${
        hasDebt ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'
      } p-6`}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={hasDebt ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: hasDebt ? Infinity : 0 }}
          className={`p-3 ${
            hasDebt ? 'bg-amber-100' : 'bg-green-100'
          } rounded-lg`}
        >
          {hasDebt ? (
            <Clock className="text-amber-600" size={24} />
          ) : (
            <CheckCircle className="text-green-600" size={24} />
          )}
        </motion.div>

        <div className="flex-1">
          <p className={`text-sm font-medium ${
            hasDebt ? 'text-amber-700' : 'text-green-700'
          }`}>
            Deuda de Horas
          </p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${
              hasDebt ? 'text-amber-900' : 'text-green-900'
            }`}>
              {HourDebtService.minutesToHoursString(balanceMinutes)}
            </p>
            {hasDebt && (
              <span className="text-xs text-amber-600">
                ({balanceMinutes} min)
              </span>
            )}
          </div>
        </div>

        {hasDebt && (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
              <AlertCircle className="h-3 w-3" />
              Pendiente
            </span>
            <p className="text-xs text-amber-600 mt-1">
              Se pagará con excesos
            </p>
          </div>
        )}

        {!hasDebt && (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
              <CheckCircle className="h-3 w-3" />
              Al día
            </span>
            <p className="text-xs text-green-600 mt-1">
              Sin deudas pendientes
            </p>
          </div>
        )}
      </div>

      {hasDebt && (
        <div className="mt-4 pt-4 border-t border-amber-200">
          <div className="flex items-center gap-2 text-xs text-amber-700">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>
              Cuando trabajes más de 8 horas diarias, el exceso se descontará automáticamente
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
