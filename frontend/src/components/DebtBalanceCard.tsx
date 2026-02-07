'use client';

import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useMyBalance } from '@/hooks/useHourDebt';

/**
 * Card that displays the user's current hour debt balance
 * Shows green "¡Al día!" message if no debt, red warning if debt exists
 */
export default function DebtBalanceCard() {
  const { data: balanceData, isLoading, error } = useMyBalance();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Clock className="text-gray-400 animate-pulse" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Deuda de Horas</p>
            <p className="text-lg text-gray-400">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
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

  const balanceMinutes = balanceData || 0;
  const hasDebt = balanceMinutes > 0;

  // Convert minutes to hours for display
  const hours = Math.floor(balanceMinutes / 60);
  const minutes = balanceMinutes % 60;
  const balanceText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;

  // No debt - show success state
  if (!hasDebt) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Deuda de Horas</p>
            <p className="text-2xl font-bold text-green-600">¡Al día!</p>
          </div>
        </div>
      </div>
    );
  }

  // Has debt - show warning state
  return (
    <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertCircle className="text-red-600" size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-600">Deuda de Horas</p>
          <p className="text-2xl font-bold text-red-600">{balanceText}</p>
        </div>
      </div>
    </div>
  );
}
