'use client';

import { useState } from 'react';
import {
  Clock,
  Users,
  TrendingDown,
  Plus,
  Search,
  Trash2,
  X,
  AlertCircle,
  Calendar,
  CheckCircle,
  BarChart3,
  FileText,
  History,
  User,
  Edit,
  ClipboardCheck,
} from 'lucide-react';
import { useCan } from '@/hooks/usePermissions';
import { Action } from '@/contexts/AbilityContext';
import MainLayout from '@/components/layout/MainLayout';
import {
  useAllDebts,
  useBusinessStats,
  useCreateDebt,
  useDeleteDebt,
  useCancelDebt,
  useMyBalance,
  useMyHistory,
  useUpdateDebt,
  useRequestMonthlyDebtReview,
} from '@/hooks/useHourDebt';
import { useUsuarios } from '@/hooks/useUsuarios';
import HourDebtService, { HourDebt, DebtStatus, CreateDebtDto, UpdateDebtDto } from '@/services/hourDebt.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { showConfirm, showPrompt } from '@/lib/app-dialog';
import DeductionHistoryModal from '@/components/DeductionHistoryModal';

export default function DeudaHorasPage() {
  const canManageDebt = useCan(Action.Manage, 'HourDebt');
  const canReadDebt = useCan(Action.Read, 'HourDebt');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DebtStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<HourDebt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<HourDebt | null>(null);
  const [viewingHistoryDebt, setViewingHistoryDebt] = useState<HourDebt | null>(null);

  // Admin hooks
  const { data: allDebts, isLoading: allDebtsLoading } = useAllDebts();
  const { data: stats, isLoading: statsLoading } = useBusinessStats();
  const { data: usuarios, isLoading: usuariosLoading } = useUsuarios();

  // User hooks
  const { data: myBalance, isLoading: myBalanceLoading } = useMyBalance();
  const { data: myHistory, isLoading: myHistoryLoading } = useMyHistory();

  // Shared hooks
  const createMutation = useCreateDebt();
  const updateMutation = useUpdateDebt();
  const deleteMutation = useDeleteDebt();
  const cancelMutation = useCancelDebt();
  const reviewMutation = useRequestMonthlyDebtReview();

  const [formData, setFormData] = useState<CreateDebtDto>({
    usuarioId: undefined,
    minutesOwed: 0,
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // Estados para entrada de horas y minutos (crear deuda)
  const [hoursInput, setHoursInput] = useState(0);
  const [minutesInput, setMinutesInput] = useState(0);

  const [editFormData, setEditFormData] = useState<UpdateDebtDto>({
    minutesOwed: 0,
    remainingMinutes: 0,
    adminReason: '',
  });

  // Estados para entrada de horas y minutos (editar deuda)
  const [editHoursOwed, setEditHoursOwed] = useState(0);
  const [editMinutesOwed, setEditMinutesOwed] = useState(0);
  const [editHoursRemaining, setEditHoursRemaining] = useState(0);
  const [editMinutesRemaining, setEditMinutesRemaining] = useState(0);

  // Allow access if user can manage or at least read hour debts
  if (!canManageDebt && !canReadDebt) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={64} className="text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h1>
            <p className="text-gray-600">
              No tienes permisos para acceder a esta página
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Use different data based on permissions
  const debts = canManageDebt ? allDebts : myHistory;
  const debtsLoading = canManageDebt ? allDebtsLoading : myHistoryLoading;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalMinutes = (hoursInput * 60) + minutesInput;
    if (totalMinutes < 1) {
      toast.error('Ingresa al menos 1 minuto de deuda');
      return;
    }
    await createMutation.mutateAsync({
      ...formData,
      minutesOwed: totalMinutes,
    });
    setShowCreateModal(false);
    setFormData({
      usuarioId: undefined,
      minutesOwed: 0,
      date: new Date().toISOString().split('T')[0],
      reason: '',
    });
    setHoursInput(0);
    setMinutesInput(0);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt || !editFormData.adminReason) {
      toast.error('Por favor ingresa un motivo para la edición');
      return;
    }
    const minutesOwed = (editHoursOwed * 60) + editMinutesOwed;
    const remainingMinutes = (editHoursRemaining * 60) + editMinutesRemaining;
    if (minutesOwed < 1) {
      toast.error('La deuda original debe ser al menos 1 minuto');
      return;
    }
    await updateMutation.mutateAsync({
      id: editingDebt.id,
      dto: {
        ...editFormData,
        minutesOwed,
        remainingMinutes,
      },
    });
    setEditingDebt(null);
    setEditFormData({
      minutesOwed: 0,
      remainingMinutes: 0,
      adminReason: '',
    });
    setEditHoursOwed(0);
    setEditMinutesOwed(0);
    setEditHoursRemaining(0);
    setEditMinutesRemaining(0);
  };

  const handleDelete = async () => {
    if (!deletingDebt) return;
    await deleteMutation.mutateAsync(deletingDebt.id);
    setDeletingDebt(null);
  };

  const handleCancel = async (debt: HourDebt) => {
    const reason = await showPrompt({
      title: 'Cancelar deuda',
      message: 'Motivo de cancelación:',
      placeholder: 'Motivo',
      required: true,
      confirmText: 'Cancelar deuda',
      danger: true,
    });
    if (!reason) return;
    await cancelMutation.mutateAsync({ id: debt.id, reason });
  };

  const openEditModal = (debt: HourDebt) => {
    setEditingDebt(debt);
    setEditFormData({
      minutesOwed: debt.minutesOwed,
      remainingMinutes: debt.remainingMinutes,
      adminReason: '',
    });
    // Inicializar los inputs de horas y minutos
    setEditHoursOwed(Math.floor(debt.minutesOwed / 60));
    setEditMinutesOwed(debt.minutesOwed % 60);
    setEditHoursRemaining(Math.floor(debt.remainingMinutes / 60));
    setEditMinutesRemaining(debt.remainingMinutes % 60);
  };

  const handleRequestMonthlyReview = async () => {
    const confirmed = await showConfirm({
      title: 'Revisar y aplicar descuentos del mes',
      message:
        'Se ejecutará una revisión mensual y se aplicarán descuentos faltantes desde la fecha de creación de cada deuda. ¿Deseas continuar?',
      confirmText: 'Ejecutar revisión',
    });
    if (!confirmed) return;

    const result = await reviewMutation.mutateAsync();
    toast.info(
      `Revisión mensual: ${HourDebtService.minutesToHoursString(result.autoAppliedMinutes)} aplicadas, diferencia pendiente ${HourDebtService.minutesToHoursString(result.remainingGapMinutes)} (${result.usersWithGaps} usuarios con diferencia)`,
    );
  };

  const filteredDebts = debts?.filter((debt) => {
    const matchesSearch =
      debt.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || debt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="text-amber-600 h-5 w-5 sm:h-7 sm:w-7" />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {canManageDebt ? 'Gestión de Deuda de Horas' : 'Mi Deuda de Horas'}
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 ml-9 sm:ml-12">
                {canManageDebt
                  ? 'Sistema automático de compensación de horas con excesos de trabajo'
                  : 'Consulta y registra tus deudas de horas'}
              </p>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
              {canManageDebt && (
                <button
                  onClick={handleRequestMonthlyReview}
                  disabled={reviewMutation.isPending}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  {reviewMutation.isPending ? 'Revisando...' : 'Revisar descuento mensual'}
                </button>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-sm text-sm sm:text-base"
              >
                <Plus className="h-4 w-4" />
                Nueva Deuda
              </button>
            </div>
          </div>
        </div>

        {/* Statistics - Different for admin vs user */}
        {canManageDebt ? (
          // Admin statistics
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                  <Clock className="text-amber-600 h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Deuda Total Activa</p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-20 sm:w-24 rounded mt-1"></div>
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                      {HourDebtService.minutesToHoursString(stats?.totalActiveDebt || 0)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg">
                  <Users className="text-indigo-600 h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Usuarios con Deuda</p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-20 sm:w-24 rounded mt-1"></div>
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {stats?.usersWithDebt || 0}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                  <TrendingDown className="text-green-600 h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Pagado Este Mes</p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-20 sm:w-24 rounded mt-1"></div>
                  ) : (
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                      {HourDebtService.minutesToHoursString(stats?.paidThisMonth || 0)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // User balance card
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-lg ${(myBalance || 0) > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                  {(myBalance || 0) > 0 ? (
                    <AlertCircle className="text-amber-600 h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <CheckCircle className="text-green-600 h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Mi Deuda Actual</p>
                  {myBalanceLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-20 sm:w-24 rounded mt-1"></div>
                  ) : (
                    <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${(myBalance || 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {(myBalance || 0) > 0
                        ? HourDebtService.minutesToHoursString(myBalance || 0)
                        : '¡Al día!'}
                    </p>
                  )}
                </div>
              </div>
              {(myBalance || 0) > 0 && (
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Las horas extra trabajadas (más de 8h/día) reducen automáticamente tu deuda
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-blue-900">
              Cómo funciona el sistema
            </h3>
            <ul className="text-xs sm:text-sm text-blue-700 mt-1.5 sm:mt-2 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">?</span>
                <span>
                  Cuando se aprueba un registro que excede el umbral diario (8 horas por defecto),
                  el exceso se descuenta automáticamente de las deudas activas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">?</span>
                <span>
                  Las deducciones se aplican por orden FIFO (primeras deudas primero)
                </span>
              </li>
              {canManageDebt && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">?</span>
                  <span>
                    Si un registro se rechaza o elimina, las deducciones asociadas se revierten automáticamente
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Debts Table */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <BarChart3 className="text-amber-600 h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  {canManageDebt ? 'Registro de Deudas' : 'Mi Historial de Deudas'} ({filteredDebts?.length || 0})
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as DebtStatus | 'ALL')}
                  className="px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="ALL">Todos</option>
                  <option value={DebtStatus.ACTIVE}>Activas</option>
                  <option value={DebtStatus.FULLY_PAID}>Pagadas</option>
                  <option value={DebtStatus.CANCELLED}>Canceladas</option>
                </select>

                {/* Search - only for admin */}
                {canManageDebt && (
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64 px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          {debtsLoading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Cargando deudas...</p>
            </div>
          ) : filteredDebts && filteredDebts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {canManageDebt && (
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                    )}
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Fecha Deuda
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Registrada
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Deuda Original
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pendiente
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Motivo
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDebts.map((debt) => (
                    <motion.tr
                      key={debt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      {canManageDebt && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1 sm:p-1.5 bg-indigo-100 rounded">
                              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-600" />
                            </div>
                            <span className="font-medium text-gray-900 text-xs sm:text-sm">
                              {debt.usuario?.nombre}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                          <span className="text-xs sm:text-sm text-gray-900">
                            {format(new Date(debt.date), 'dd MMM yyyy', { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm text-gray-900">
                            {format(new Date(debt.createdAt), 'dd MMM yyyy', { locale: es })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(debt.createdAt), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          {HourDebtService.minutesToHoursString(debt.minutesOwed)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-semibold text-amber-900">
                          {HourDebtService.minutesToHoursString(debt.remainingMinutes)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            debt.status === DebtStatus.ACTIVE
                              ? 'bg-amber-100 text-amber-800'
                              : debt.status === DebtStatus.FULLY_PAID
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {debt.status === DebtStatus.ACTIVE && <AlertCircle className="h-3 w-3" />}
                          {debt.status === DebtStatus.FULLY_PAID && <CheckCircle className="h-3 w-3" />}
                          <span className="hidden sm:inline">
                            {debt.status === DebtStatus.ACTIVE
                              ? 'Activa'
                              : debt.status === DebtStatus.FULLY_PAID
                              ? 'Pagada'
                              : 'Cancelada'}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <span className="text-xs sm:text-sm text-gray-600 max-w-xs truncate block">
                          {debt.reason || '-'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {/* View deduction history */}
                          <button
                            onClick={() => setViewingHistoryDebt(debt)}
                            className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Ver historial de pagos"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {/* Admin only actions */}
                          {canManageDebt && (
                            <>
                              {/* Edit */}
                              <button
                                onClick={() => openEditModal(debt)}
                                className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                                title="Editar deuda"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {/* Cancel - only for active debts */}
                              {debt.status === DebtStatus.ACTIVE && (
                                <button
                                  onClick={() => handleCancel(debt)}
                                  className="text-amber-600 hover:text-amber-900 p-1.5 hover:bg-amber-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                                  title="Cancelar deuda"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                              {/* Delete */}
                              <button
                                onClick={() => setDeletingDebt(debt)}
                                className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No se encontraron resultados'
                  : canManageDebt ? 'No hay deudas registradas' : 'No tienes deudas registradas'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'Intenta con otros filtros'
                  : canManageDebt ? 'Comienza agregando la primera deuda' : 'Registra una nueva deuda si es necesario'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Plus className="text-amber-600 h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Nueva Deuda de Horas
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 sm:space-y-4">
                {/* User selector - only for admin */}
                {canManageDebt && (
                  <div>
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      <User className="h-4 w-4" />
                      Usuario *
                    </label>
                    <select
                      value={formData.usuarioId || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usuarioId: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                      required
                    >
                      <option value="">Selecciona un usuario...</option>
                      {usuarios?.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nombre} ({usuario.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    <Clock className="h-4 w-4" />
                    Tiempo Adeudado *
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Horas</label>
                      <input
                        type="number"
                        min="0"
                        max="16"
                        value={hoursInput}
                        onChange={(e) => setHoursInput(Math.max(0, Math.min(16, parseInt(e.target.value) || 0)))}
                        className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Minutos</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={minutesInput}
                        onChange={(e) => setMinutesInput(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ej: 1h 30min = 1 hora y 30 minutos
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    <Calendar className="h-4 w-4" />
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                    Motivo (opcional)
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                    placeholder="Ej: Ausencia por motivos personales"
                  />
                </div>

                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    {createMutation.isPending ? 'Creando...' : 'Crear Deuda'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal - Admin Only */}
      <AnimatePresence>
        {editingDebt && canManageDebt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Edit className="text-blue-600 h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Editar Deuda
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {editingDebt.usuario?.nombre}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingDebt(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    <Clock className="h-4 w-4" />
                    Deuda Original
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Horas</label>
                      <input
                        type="number"
                        min="0"
                        max="16"
                        value={editHoursOwed}
                        onChange={(e) => setEditHoursOwed(Math.max(0, Math.min(16, parseInt(e.target.value) || 0)))}
                        className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Minutos</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={editMinutesOwed}
                        onChange={(e) => setEditMinutesOwed(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    <Clock className="h-4 w-4" />
                    Pendiente
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Horas</label>
                      <input
                        type="number"
                        min="0"
                        max="16"
                        value={editHoursRemaining}
                        onChange={(e) => setEditHoursRemaining(Math.max(0, Math.min(16, parseInt(e.target.value) || 0)))}
                        className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Minutos</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={editMinutesRemaining}
                        onChange={(e) => setEditMinutesRemaining(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                    Motivo de Edición *
                  </label>
                  <textarea
                    value={editFormData.adminReason}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, adminReason: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                    placeholder="Describe el motivo de esta modificación..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este motivo se guardará en el historial de auditoría
                  </p>
                </div>

                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingDebt(null)}
                    className="flex-1 px-4 py-2 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingDebt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="text-red-600 h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Eliminar Deuda
                </h3>
              </div>

              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                ¿Estás seguro de eliminar esta deuda de <strong>{deletingDebt.usuario?.nombre}</strong>?
                Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setDeletingDebt(null)}
                  className="flex-1 px-4 py-2 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deduction History Modal */}
      <DeductionHistoryModal
        debtId={viewingHistoryDebt?.id || 0}
        isOpen={!!viewingHistoryDebt}
        onClose={() => setViewingHistoryDebt(null)}
      />
    </MainLayout>
  );
}
