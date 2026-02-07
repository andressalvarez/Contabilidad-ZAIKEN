'use client';

import { useState } from 'react';
import { BarChart3, Search, Calendar, Clock, FileText, Eye, CheckCircle, XCircle, Ban } from 'lucide-react';
import { useMyHistory } from '@/hooks/useHourDebt';
import DeductionHistoryModal from './DeductionHistoryModal';

/**
 * Table displaying the user's hour debt history
 * Shows all debts with search, status badges, and detail view
 */
export default function DebtHistoryTable() {
  const { data: debts, isLoading, error } = useMyHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Convert minutes to readable format
  const minutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get badge color and icon based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Clock className="h-3 w-3" />
            Activa
          </span>
        );
      case 'FULLY_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Pagada
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Ban className="h-3 w-3" />
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Filter debts by search term
  const filteredDebts = debts?.filter((debt) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      debt.reason?.toLowerCase().includes(searchLower) ||
      formatDate(debt.date).toLowerCase().includes(searchLower) ||
      debt.status.toLowerCase().includes(searchLower)
    );
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BarChart3 className="text-gray-400 animate-pulse" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Historial de Deudas
            </h2>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando historial...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="text-red-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Historial de Deudas
            </h2>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <p className="text-red-600 mt-1">No se pudo cargar el historial de deudas</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no debts
  if (!debts || debts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Historial de Deudas (0)
            </h2>
          </div>
        </div>
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes deudas registradas
          </h3>
          <p className="text-gray-600">
            ¡Estás al día con tus horas de trabajo!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header with search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="text-blue-600" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Historial de Deudas ({debts.length})
              </h2>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por motivo, fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas Originales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo Restante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDebts && filteredDebts.length > 0 ? (
                filteredDebts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-gray-50 transition-colors">
                    {/* ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">#{debt.id}</span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(debt.date)}</span>
                      </div>
                    </td>

                    {/* Original Hours */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {minutesToHours(debt.minutesOwed)}
                        </span>
                      </div>
                    </td>

                    {/* Remaining Balance */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-bold ${
                          debt.remainingMinutes === 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {minutesToHours(debt.remainingMinutes)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(debt.status)}
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4">
                      {debt.reason ? (
                        <div className="flex items-start gap-1 max-w-xs">
                          <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600 line-clamp-2">
                            {debt.reason}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Sin motivo</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedDebtId(debt.id)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded transition-colors"
                        title="Ver historial de deducciones"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">Detalles</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron resultados
                    </h3>
                    <p className="text-gray-600">
                      Intenta con otro término de búsqueda
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deduction History Modal */}
      {selectedDebtId && (
        <DeductionHistoryModal
          debtId={selectedDebtId}
          isOpen={selectedDebtId !== null}
          onClose={() => setSelectedDebtId(null)}
        />
      )}
    </>
  );
}
