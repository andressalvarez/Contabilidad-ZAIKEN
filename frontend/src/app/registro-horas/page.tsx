'use client'

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useRegistroHoras,
  useCreateRegistroHoras,
  useUpdateRegistroHoras,
  useDeleteRegistroHoras,
  useActiveTimer,
  useStartTimer,
  useCancelTimer,
  useUpdateTimerTimes,
  useResubmitRegistro
} from '@/hooks/useRegistroHoras';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useUser } from '@/hooks/useUser';
import MainLayout from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Clock,
  User,
  Users,
  Calendar,
  FileText,
  Search,
  AlertCircle,
  BarChart3,
  Timer,
  CheckCircle,
  XCircle,
  Info,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  Target,
  PieChart,
  Send
} from 'lucide-react';
import { RegistroHoras, CreateRegistroHorasDto } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { StopTimerModal } from '@/components/StopTimerModal';
import HourDebtWidget from '@/components/hour-debt/HourDebtWidget';
import { ScrollableTable } from '@/components/ui/ScrollableTable';
import CreateDebtModal from '@/components/CreateDebtModal';
import DebtHistoryTable from '@/components/DebtHistoryTable';

interface FormData {
  fecha: string;
  usuarioId: number;
  horas: number;
  descripcion: string;
}

// Animated Clock Component
function AnimatedClock({ isRunning, elapsedSeconds }: { isRunning: boolean; elapsedSeconds: number }) {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="relative">
      {/* Animated outer circle */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: isRunning
            ? 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #a855f7, #6366f1)'
            : 'conic-gradient(from 0deg, #e5e7eb, #d1d5db, #e5e7eb)',
        }}
        animate={isRunning ? { rotate: 360 } : { rotate: 0 }}
        transition={isRunning ? { duration: 3, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
      />

      {/* Inner circle */}
      <div className="relative z-10 w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-white shadow-2xl flex flex-col items-center justify-center m-2">
        {/* Animated clock icon */}
        <motion.div
          animate={isRunning ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={isRunning ? { duration: 1, repeat: Infinity } : {}}
          className="mb-1 sm:mb-2"
        >
          <Clock
            className={`h-7 w-7 sm:h-10 sm:w-10 ${isRunning ? 'text-indigo-600' : 'text-gray-400'}`}
          />
        </motion.div>

        {/* Time display */}
        <div className={`text-xl sm:text-3xl font-mono font-bold ${isRunning ? 'text-indigo-600' : 'text-gray-600'}`}>
          <span>{formatNumber(hours)}</span>
          <motion.span
            animate={isRunning ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity }}
          >:</motion.span>
          <span>{formatNumber(minutes)}</span>
          <motion.span
            animate={isRunning ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity }}
          >:</motion.span>
          <span>{formatNumber(seconds)}</span>
        </div>

        {/* Status */}
        <motion.p
          className={`text-xs sm:text-sm mt-1 sm:mt-2 font-medium ${isRunning ? 'text-green-600' : 'text-gray-500'}`}
          animate={isRunning ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isRunning ? 'Trabajando...' : 'Listo para iniciar'}
        </motion.p>
      </div>
    </div>
  );
}

// Main Timer Widget Component
function TimerWidget({
  users,
  onTimerStop,
  currentUserId,
  isAdmin
}: {
  users: any[];
  onTimerStop?: (record: RegistroHoras) => void;
  currentUserId: number;
  isAdmin: boolean;
}) {
  const [selectedUserId, setSelectedUserId] = useState<number>(currentUserId || 0);
  const [description, setDescription] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showStopModal, setShowStopModal] = useState(false);

  // Auto-select current user when loaded
  useEffect(() => {
    if (currentUserId && selectedUserId === 0) {
      setSelectedUserId(currentUserId);
    }
  }, [currentUserId, selectedUserId]);

  // Timer hooks
  const { data: activeTimer, refetch: refetchActiveTimer } = useActiveTimer(selectedUserId);
  const startTimerMutation = useStartTimer();
  const cancelTimerMutation = useCancelTimer();

  const isRunning = activeTimer?.estado === 'RUNNING';
  const isPaused = activeTimer?.estado === 'PAUSADO';
  const hasActiveTimer = !!activeTimer && (isRunning || isPaused);

  // Calculate elapsed time
  useEffect(() => {
    if (activeTimer?.timerInicio) {
      const start = new Date(activeTimer.timerInicio);

      if (isRunning) {
        const interval = setInterval(() => {
          const now = new Date();
          const totalSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
          setElapsedSeconds(totalSeconds);
        }, 1000);
        return () => clearInterval(interval);
      }
      // If not running but has timerInicio, show accumulated time
      const totalSeconds = Math.floor((new Date().getTime() - start.getTime()) / 1000);
      setElapsedSeconds(totalSeconds);
    } else {
      setElapsedSeconds(0);
    }
  }, [activeTimer, isRunning]);

  // Refresh active timer when user changes
  useEffect(() => {
    if (selectedUserId) {
      refetchActiveTimer();
    }
  }, [selectedUserId, refetchActiveTimer]);

  const handleStart = async () => {
    if (!selectedUserId) {
      toast.error('Selecciona un usuario primero');
      return;
    }
    try {
      await startTimerMutation.mutateAsync({
        usuarioId: selectedUserId,
        descripcion: description || undefined
      });
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStop = () => {
    setShowStopModal(true);
  };

  const handleCancel = async () => {
    if (!activeTimer) return;
    const confirmed = confirm('¿Cancelar el timer? Los datos no se guardarán.');
    if (!confirmed) return;
    try {
      await cancelTimerMutation.mutateAsync(activeTimer.id);
      setDescription('');
      setElapsedSeconds(0);
    } catch (error) {
      console.error('Error canceling timer:', error);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl sm:rounded-2xl shadow-xl border border-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
        {/* Animated Clock */}
        <div className="flex-shrink-0">
          <AnimatedClock isRunning={isRunning} elapsedSeconds={elapsedSeconds} />
        </div>

        {/* Controls */}
        <div className="flex-1 w-full space-y-4 sm:space-y-6">
          {/* User Selector */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 text-indigo-600" />
              {isAdmin ? '¿Para quién registras tiempo?' : 'Tu Timer'}
            </label>
            {isAdmin ? (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(parseInt(e.target.value) || 0)}
                disabled={hasActiveTimer}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-lg disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              >
                <option value="">Selecciona un usuario...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.nombre} {user.id === currentUserId ? '(Yo)' : ''} {user.rolNegocio?.nombreRol ? `- ${user.rolNegocio.nombreRol}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                <div className="p-2 bg-indigo-600 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-medium text-indigo-900">
                  {users.find(u => u.id === currentUserId)?.nombre || 'Tu usuario'}
                </span>
              </div>
            )}
          </div>

          {/* Active User Badge */}
          {selectedUser && hasActiveTimer && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 bg-indigo-100 rounded-xl"
            >
              <div className="p-2 bg-indigo-600 rounded-full">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-indigo-900">{selectedUser.nombre}</p>
                <p className="text-sm text-indigo-600">Timer activo desde {new Date(activeTimer.timerInicio!).toLocaleTimeString('es-CO')}</p>
              </div>
            </motion.div>
          )}

          {/* Description Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              ¿Qué estás haciendo? (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Desarrollo de nuevas funcionalidades..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
            {!hasActiveTimer ? (
              /* START Button */
              <motion.button
                onClick={handleStart}
                disabled={!selectedUserId || startTimerMutation.isPending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-base sm:text-lg min-h-[48px]"
              >
                <Play className="h-5 w-5 sm:h-6 sm:w-6" fill="white" />
                {startTimerMutation.isPending ? 'Iniciando...' : 'Iniciar Timer'}
              </motion.button>
            ) : (
              <>
                {/* STOP Button - Primary action */}
                <motion.button
                  onClick={handleStop}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl shadow-lg transition-all font-semibold text-base sm:text-lg min-h-[48px]"
                >
                  <Square className="h-5 w-5 sm:h-6 sm:w-6" fill="white" />
                  Finalizar y Guardar
                </motion.button>

                {/* CANCEL Button */}
                <motion.button
                  onClick={handleCancel}
                  disabled={cancelTimerMutation.isPending}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl sm:rounded-2xl transition-all min-h-[48px]"
                  title="Cancelar sin guardar"
                >
                  <X className="h-5 w-5" />
                  Cancelar
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stop Timer Modal */}
      {showStopModal && activeTimer && (
        <StopTimerModal
          activeTimer={activeTimer}
          onClose={() => setShowStopModal(false)}
          onSuccess={(savedRecord) => {
            setShowStopModal(false);
            setDescription('');
            setElapsedSeconds(0);
            refetchActiveTimer();
            onTimerStop?.(savedRecord);
          }}
        />
      )}
    </div>
  );
}

// Component to show recently created record (editable description only)
function RecentTimerRecord({
  record,
  users,
  onEdit,
  onDismiss
}: {
  record: RegistroHoras;
  users: any[];
  onEdit: (id: number, data: any) => void;
  onDismiss: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [descripcion, setDescripcion] = useState(record.descripcion || '');

  const user = users.find(u => u.id === (record.usuarioId));

  const handleSave = () => {
    onEdit(record.id, { descripcion });
    setIsEditing(false);
  };

  // Format time range
  const formatTimeRange = () => {
    if (!record.timerInicio || !record.timerFin) return null;
    const start = new Date(record.timerInicio);
    const end = new Date(record.timerFin);
    return `${start.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg"
    >
      <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: 2 }}
            className="p-1.5 sm:p-2 bg-green-500 rounded-full flex-shrink-0"
          >
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </motion.div>
          <div>
            <h3 className="font-bold text-green-800 text-sm sm:text-base">¡Tiempo registrado!</h3>
            <p className="text-xs sm:text-sm text-green-600">Puedes agregar una descripción</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
        {/* User */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white rounded-lg">
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 flex-shrink-0" />
          <span className="font-medium text-xs sm:text-sm truncate">{user?.nombre || 'Usuario'}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white rounded-lg">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm">{new Date(record.fecha).toLocaleDateString('es-CO')}</span>
        </div>

        {/* Hours (read-only) */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white rounded-lg">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 flex-shrink-0" />
          <span className="font-bold text-indigo-600 text-xs sm:text-sm">{record.horas.toFixed(2)}h</span>
        </div>
      </div>

      {/* Time Range if from timer */}
      {record.origen === 'TIMER' && formatTimeRange() && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-blue-800">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="font-medium">Horario:</span>
            <span>{formatTimeRange()}</span>
          </div>
        </div>
      )}

      {/* Description (always editable) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          Descripción del trabajo realizado
        </label>
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="¿Qué trabajaste?"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setDescripcion(record.descripcion || '');
                }}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="flex-1 p-3 bg-white border border-gray-200 rounded-lg min-h-[60px]">
              <p className="text-gray-700">
                {record.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              {record.descripcion ? 'Editar' : 'Agregar'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function RegistroHorasPage() {
  const [formData, setFormData] = useState<FormData>(() => ({
    fecha: new Date().toISOString().split('T')[0],
    usuarioId: 0, // Se actualizara cuando tengamos el currentUser
    horas: 0,
    descripcion: ''
  }));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<RegistroHoras>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [recentTimerRecord, setRecentTimerRecord] = useState<RegistroHoras | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [timeEditModal, setTimeEditModal] = useState<{ open: boolean; record: RegistroHoras | null }>({ open: false, record: null });
  const [showDebtModal, setShowDebtModal] = useState(false);

  // Get current user
  const { user: currentUser, loading: userLoading } = useUser();
  const isAdmin = currentUser?.rol === 'ADMIN' || currentUser?.rol === 'ADMIN_NEGOCIO';

  // React Query hooks
  const { data: timeRecords = [], isLoading, error, refetch } = useRegistroHoras();
  const { data: users = [] } = useUsuarios();
  const createMutation = useCreateRegistroHoras();
  const updateMutation = useUpdateRegistroHoras();
  const deleteMutation = useDeleteRegistroHoras();
  const resubmitMutation = useResubmitRegistro();
  const updateTimesMutation = useUpdateTimerTimes();

  // Get current user's name from users list
  const currentUserData = useMemo(() => {
    return users.find(u => u.id === currentUser?.id);
  }, [users, currentUser]);

  // Inicializar formData con el usuario actual cuando se carga
  useEffect(() => {
    if (currentUser?.id && formData.usuarioId === 0) {
      setFormData(prev => ({ ...prev, usuarioId: currentUser.id }));
    }
  }, [currentUser?.id, formData.usuarioId]);

  // Registros personales del usuario actual (solo los suyos)
  const myRegistros = useMemo(() => {
    if (!currentUser?.id) return [];
    return (timeRecords || []).filter(r => r.usuarioId === currentUser.id);
  }, [timeRecords, currentUser?.id]);

  // Registros de hoy del usuario actual
  const myTodayRegistros = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return myRegistros.filter(r => r.fecha.split('T')[0] === today);
  }, [myRegistros]);

  // Filter records by search, view mode, and status
  const filteredRegistros = useMemo(() => {
    // If personal mode, only show own records
    let baseRegistros = viewMode === 'personal' ? myRegistros : timeRecords;

    // Filter by approval status
    if (statusFilter !== 'all') {
      baseRegistros = baseRegistros.filter(r => {
        if (statusFilter === 'approved') return r.aprobado;
        if (statusFilter === 'rejected') return r.rechazado;
        if (statusFilter === 'pending') return !r.aprobado && !r.rechazado && r.estado === 'COMPLETADO';
        return true;
      });
    }

    if (!searchTerm) return baseRegistros;
    return baseRegistros.filter(registro => {
      const usuarioId = registro.usuarioId;
      const usuario = (users || []).find(u => u.id === usuarioId);
      const nombreUsuario = usuario?.nombre || '';
      return nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
             registro.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             registro.horas.toString().includes(searchTerm);
    });
  }, [timeRecords, myRegistros, users, searchTerm, viewMode, statusFilter]);

  // Estadisticas PERSONALES del usuario actual (HOY)
  const myTodayStats = useMemo(() => {
    const totalHorasHoy = myTodayRegistros.reduce((acc, r) => acc + (r.horas || 0), 0);
    return {
      totalHorasHoy,
      registrosHoy: myTodayRegistros.length
    };
  }, [myTodayRegistros]);

  // Estadisticas personales totales
  const myTotalStats = useMemo(() => {
    const totalHoras = myRegistros.reduce((acc, r) => acc + (r.horas || 0), 0);
    return {
      totalHoras,
      totalRegistros: myRegistros.length
    };
  }, [myRegistros]);

  // Estadisticas del equipo (para admin)
  const teamStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRegistros = timeRecords.filter(r => r.fecha.split('T')[0] === today);
    const totalHorasHoy = todayRegistros.reduce((acc, r) => acc + (r.horas || 0), 0);
    const totalHoras = timeRecords.reduce((acc, r) => acc + (r.horas || 0), 0);
    const usersActivos = new Set(todayRegistros.map(r => r.usuarioId)).size;

    return {
      totalHorasHoy,
      registrosHoy: todayRegistros.length,
      totalHoras,
      totalRegistros: timeRecords.length,
      usersActivos
    };
  }, [timeRecords]);

  // Estadisticas por usuario (para graficos admin)
  const statsByUser = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRegistros = timeRecords.filter(r => r.fecha.split('T')[0] === today);

    const userMap = new Map<number, { nombre: string; horasHoy: number; registrosHoy: number; horasTotal: number }>();

    // Inicializar con todos los users
    users.forEach(u => {
      userMap.set(u.id, {
        nombre: u.nombre,
        horasHoy: 0,
        registrosHoy: 0,
        horasTotal: 0
      });
    });

    // Sumar horas de hoy
    todayRegistros.forEach(r => {
      const userId = r.usuarioId;
      if (userId && userMap.has(userId)) {
        const stats = userMap.get(userId)!;
        stats.horasHoy += r.horas || 0;
        stats.registrosHoy += 1;
      }
    });

    // Sumar horas totales
    timeRecords.forEach(r => {
      const userId = r.usuarioId;
      if (userId && userMap.has(userId)) {
        const stats = userMap.get(userId)!;
        stats.horasTotal += r.horas || 0;
      }
    });

    return Array.from(userMap.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.horasHoy - a.horasHoy);
  }, [timeRecords, users]);

  const getUserName = (registro: RegistroHoras) => {
    const usuarioId = registro.usuarioId;
    const usuario = (users || []).find(u => u.id === usuarioId);
    return usuario?.nombre || 'Usuario no encontrado';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const handleTimerStop = useCallback((registro: RegistroHoras) => {
    setRecentTimerRecord(registro);
    refetch();
  }, [refetch]);

  const handleEditRecentRecord = async (id: number, data: any) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      setRecentTimerRecord(null);
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  // Agregar nuevo registro manual
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usuarioId || !formData.horas) {
      toast.error('Debe ingresar Usuario y Horas');
      return;
    }

    try {
      const createData: CreateRegistroHorasDto = {
        usuarioId: formData.usuarioId,
        fecha: formData.fecha,
        horas: formData.horas,
        descripcion: formData.descripcion
      };

      await createMutation.mutateAsync(createData);

      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        usuarioId: 0,
        horas: 0,
        descripcion: ''
      });
      setShowManualForm(false);
    } catch (error) {
      console.error('Error al crear registro de horas:', error);
    }
  };

  const handleEdit = (registroHoras: RegistroHoras) => {
    setEditingId(registroHoras.id);
    setEditingData({
      usuarioId: registroHoras.usuarioId,
      fecha: registroHoras.fecha,
      horas: registroHoras.horas,
      descripcion: registroHoras.descripcion
    });
  };

  const handleSaveEdit = async (registroHoras: RegistroHoras) => {
    try {
      await updateMutation.mutateAsync({
        id: registroHoras.id,
        data: editingData
      });
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      console.error('Error al actualizar registro de horas:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = async (registroHoras: RegistroHoras) => {
    const confirmed = confirm(`Eliminar registro de ${registroHoras.horas} horas?`);
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(registroHoras.id);
    } catch (error) {
      console.error('Error al eliminar registro de horas:', error);
    }
  };

  // Re-enviar registro rechazado
  const handleResubmit = async (id: number) => {
    const confirmed = confirm('Re-enviar este registro para revisión?');
    if (!confirmed) return;

    try {
      await resubmitMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error al re-enviar registro:', error);
    }
  };

  // Abrir modal para editar tiempos
  const handleEditTimes = (record: RegistroHoras) => {
    setTimeEditModal({ open: true, record });
  };

  // Guardar cambios de tiempos
  const handleSaveTimerTimes = async (timerInicio: string, timerFin: string) => {
    if (!timeEditModal.record) return;

    try {
      await updateTimesMutation.mutateAsync({
        id: timeEditModal.record.id,
        timerInicio,
        timerFin
      });
      setTimeEditModal({ open: false, record: null });
    } catch (error) {
      console.error('Error al actualizar tiempos:', error);
    }
  };

  // Approval statistics
  const approvalStats = useMemo(() => {
    const records = viewMode === 'personal' ? myRegistros : timeRecords;
    return {
      approved: records.filter(r => r.aprobado).length,
      pending: records.filter(r => !r.aprobado && !r.rechazado && r.estado === 'COMPLETADO').length,
      rejected: records.filter(r => r.rechazado).length
    };
  }, [viewMode, myRegistros, timeRecords]);

  if (userLoading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error cargando registros de horas</h3>
              <p className="text-red-600 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header con estadisticas personales prominentes */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Title row */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Timer className="text-indigo-600 h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Control de Tiempo</h1>
                {currentUserData && (
                  <p className="text-sm sm:text-base text-gray-600">
                    Hola, <span className="font-semibold text-indigo-600">{currentUserData.nombre}</span>!
                  </p>
                )}
              </div>
            </div>

            {/* Stats and controls row */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              {/* Today stats badge */}
              <div className="flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg">
                <div className="text-center flex-1 sm:flex-none">
                  <p className="text-xs opacity-80">Mis Horas Hoy</p>
                  <p className="text-xl sm:text-2xl font-bold">{myTodayStats.totalHorasHoy.toFixed(1)}h</p>
                </div>
                <div className="w-px h-8 sm:h-10 bg-white/30" />
                <div className="text-center flex-1 sm:flex-none">
                  <p className="text-xs opacity-80">Registros</p>
                  <p className="text-xl sm:text-2xl font-bold">{myTodayStats.registrosHoy}</p>
                </div>
              </div>

              {/* Debt Button (Personal View) */}
              {viewMode === 'personal' && (
                <button
                  onClick={() => setShowDebtModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md text-sm sm:text-base min-h-[44px]"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Registrar</span> Deuda
                </button>
              )}

              {/* Toggle Admin View */}
              {isAdmin && (
                <>
                  <div className="flex bg-gray-100 rounded-lg sm:rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('personal')}
                      className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm min-h-[40px] ${
                        viewMode === 'personal'
                          ? 'bg-white shadow-md text-indigo-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Mi Tiempo</span>
                      <span className="sm:hidden">Yo</span>
                    </button>
                    <button
                      onClick={() => setViewMode('team')}
                      className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm min-h-[40px] ${
                        viewMode === 'team'
                          ? 'bg-white shadow-md text-indigo-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Equipo
                    </button>
                  </div>
                  <Link
                    href="/horas-pendientes"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-md text-sm sm:text-base min-h-[44px]"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Aprobar</span> Horas
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Timer Widget Principal */}
        <TimerWidget
          users={users}
          onTimerStop={handleTimerStop}
          currentUserId={currentUser?.id || 0}
          isAdmin={isAdmin}
        />

        {/* Registro recien creado (editable) */}
        <AnimatePresence>
          {recentTimerRecord && (
            <RecentTimerRecord
              record={recentTimerRecord}
              users={users}
              onEdit={handleEditRecentRecord}
              onDismiss={() => setRecentTimerRecord(null)}
            />
          )}
        </AnimatePresence>

        {/* Estadisticas segun modo de vista */}
        {viewMode === 'personal' ? (
          // VISTA PERSONAL: Estadisticas del usuario actual
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg">
                    <Clock className="text-indigo-600 h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Mis Horas Totales</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{myTotalStats.totalHoras.toFixed(1)}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="text-green-600 h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Mis Registros</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{myTotalStats.totalRegistros}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                    <Target className="text-amber-600 h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Promedio Diario</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                      {myTotalStats.totalRegistros > 0
                        ? (myTotalStats.totalHoras / Math.max(1, myTotalStats.totalRegistros)).toFixed(1)
                        : '0'}h
                    </p>
                  </div>
                </div>
              </div>

              {/* Hour Debt Widget */}
              <HourDebtWidget />
            </div>
          </>
        ) : (
          // VISTA EQUIPO (ADMIN): Dashboard completo
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg">
                    <Clock className="text-indigo-600 h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Horas Hoy (Equipo)</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{teamStats.totalHorasHoy.toFixed(1)}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="text-green-600 h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Horas Totales</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{teamStats.totalHoras.toFixed(1)}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                    <Users className="text-purple-600 h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Activos Hoy</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{teamStats.usersActivos}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                    <Award className="text-amber-600 h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Registros Hoy</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{teamStats.registrosHoy}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grafico de Barras: Horas por Usuario Hoy */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChart className="text-purple-600 h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Productividad del Equipo Hoy</h3>
              </div>

              {statsByUser.filter(u => u.horasHoy > 0).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nadie ha registrado horas hoy</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statsByUser
                    .filter(u => u.horasHoy > 0)
                    .slice(0, 10)
                    .map((userStats, index) => {
                      const maxHoras = Math.max(...statsByUser.map(u => u.horasHoy));
                      const percentage = maxHoras > 0 ? (userStats.horasHoy / maxHoras) * 100 : 0;
                      const isCurrentUser = userStats.id === currentUser?.id;

                      return (
                        <div key={userStats.id} className="flex items-center gap-4">
                          <div className="w-8 text-center">
                            {index === 0 && <Award className="h-5 w-5 text-amber-500 mx-auto" />}
                            {index === 1 && <span className="text-gray-500 text-sm font-medium">2</span>}
                            {index === 2 && <span className="text-gray-500 text-sm font-medium">3</span>}
                            {index > 2 && <span className="text-gray-400 text-sm">{index + 1}</span>}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${isCurrentUser ? 'text-indigo-600' : 'text-gray-700'}`}>
                                {userStats.nombre} {isCurrentUser && '(Yo)'}
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {userStats.horasHoy.toFixed(1)}h
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`h-full rounded-full ${
                                  index === 0
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                    : isCurrentUser
                                    ? 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                                    : 'bg-gradient-to-r from-gray-300 to-gray-400'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Toggle Formulario Manual */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Plus className="text-amber-600 h-5 w-5" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-gray-800">Agregar Horas Manualmente</span>
            </div>
            {showManualForm ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>

          <AnimatePresence>
            {showManualForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
                  <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="h-4 w-4" />
                          Fecha *
                        </label>
                        <input
                          type="date"
                          value={formData.fecha}
                          onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <User className="h-4 w-4" />
                          Usuario *
                        </label>
                        {isAdmin ? (
                          <select
                            value={formData.usuarioId}
                            onChange={(e) => setFormData(prev => ({ ...prev, usuarioId: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            required
                          >
                            <option value="">Seleccionar usuario</option>
                            {(users || []).map(usuario => (
                              <option key={usuario.id} value={usuario.id}>
                                {usuario.nombre} {usuario.id === currentUser?.id ? '(Yo)' : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <User className="h-4 w-4 text-indigo-600" />
                            <span className="font-medium text-indigo-900">
                              {currentUserData?.nombre || 'Tu usuario'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Clock className="h-4 w-4" />
                          Horas *
                        </label>
                        <input
                          type="number"
                          value={formData.horas}
                          onChange={(e) => setFormData(prev => ({ ...prev, horas: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          placeholder="0"
                          min="0"
                          step="0.25"
                          required
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <FileText className="h-4 w-4" />
                          Notas
                        </label>
                        <input
                          type="text"
                          value={formData.descripcion}
                          onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          placeholder="Notas adicionales"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                        {createMutation.isPending ? 'Agregando...' : 'Agregar Registro'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabla de Registros de Horas */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="text-blue-600 h-5 w-5" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  {viewMode === 'personal' ? 'Mis Registros' : 'Registros del Equipo'} ({filteredRegistros.length})
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm min-h-[44px]"
                >
                  <option value="all">Todos ({timeRecords.length})</option>
                  <option value="pending">Pendientes ({approvalStats.pending})</option>
                  <option value="approved">Aprobados ({approvalStats.approved})</option>
                  <option value="rejected">Rechazados ({approvalStats.rejected})</option>
                </select>

                {/* Search */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar registros..."
                    className="pl-10 w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Approval Stats Summary */}
          {viewMode === 'personal' && (
            <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-2 sm:gap-6">
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3" />
                {approvalStats.approved} Aprobados
              </span>
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Clock className="h-3 w-3" />
                {approvalStats.pending} Pendientes
              </span>
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <XCircle className="h-3 w-3" />
                {approvalStats.rejected} Rechazados
              </span>
            </div>
          )}

          <ScrollableTable>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Horario</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2 text-sm sm:text-base">Cargando registros de horas...</p>
                    </td>
                  </tr>
                ) : filteredRegistros.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                      <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'No se encontraron registros' : 'No hay registros de horas'}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base">
                        {searchTerm ? 'Intenta con otro termino de busqueda' : 'Usa el timer de arriba para comenzar a registrar tiempo'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRegistros.map((registroHoras) => (
                    <tr key={registroHoras.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">#{registroHoras.id}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingId === registroHoras.id ? (
                          <input
                            type="date"
                            value={editingData.fecha || registroHoras.fecha}
                            onChange={(e) => setEditingData(prev => ({ ...prev, fecha: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(registroHoras.fecha)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {editingId === registroHoras.id ? (
                          <select
                            value={editingData.usuarioId || registroHoras.usuarioId}
                            onChange={(e) => setEditingData(prev => ({ ...prev, usuarioId: parseInt(e.target.value) || 0 }))}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          >
                            {(users || []).map(usuario => (
                              <option key={usuario.id} value={usuario.id}>
                                {usuario.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="p-1 sm:p-1.5 bg-indigo-100 rounded">
                              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-600" />
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{getUserName(registroHoras)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {editingId === registroHoras.id ? (
                          <input
                            type="number"
                            value={editingData.horas || registroHoras.horas}
                            onChange={(e) => setEditingData(prev => ({ ...prev, horas: parseFloat(e.target.value) || 0 }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            min="0"
                            step="0.25"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            <Clock className="h-3 w-3" />
                            {registroHoras.horas}h
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                        {registroHoras.origen === 'TIMER' && registroHoras.timerInicio ? (
                          <div className="flex flex-col">
                            <span className="text-gray-900 text-xs sm:text-sm">
                              {new Date(registroHoras.timerInicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {registroHoras.timerFin
                                ? new Date(registroHoras.timerFin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                                : 'En curso'}
                            </span>
                            {registroHoras.timerInicioOriginal && (
                              <span className="text-xs text-purple-600">(Editado)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {registroHoras.aprobado ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3" />
                            Aprobado
                          </span>
                        ) : registroHoras.rechazado ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 cursor-help"
                            title={registroHoras.motivoRechazo || 'Sin motivo'}
                          >
                            <XCircle className="h-3 w-3" />
                            Rechazado
                          </span>
                        ) : registroHoras.estado === 'COMPLETADO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </span>
                        ) : registroHoras.estado === 'RUNNING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Timer className="h-3 w-3" />
                            En curso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Clock className="h-3 w-3" />
                            Borrador
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 max-w-[120px] sm:max-w-xs truncate">
                        {editingId === registroHoras.id ? (
                          <input
                            type="text"
                            value={editingData.descripcion || registroHoras.descripcion || ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, descripcion: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            placeholder="Notas"
                          />
                        ) : (
                          registroHoras.descripcion || '-'
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === registroHoras.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(registroHoras)}
                              disabled={updateMutation.isPending}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                              title="Guardar"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Re-enviar si está rechazado */}
                            {registroHoras.rechazado && (
                              <button
                                onClick={() => handleResubmit(registroHoras.id)}
                                className="text-amber-600 hover:text-amber-900 p-1 hover:bg-amber-50 rounded"
                                title="Corregir y re-enviar"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            {/* Editar tiempos si es TIMER y no está aprobado */}
                            {registroHoras.origen === 'TIMER' && registroHoras.timerInicio && !registroHoras.aprobado && (
                              <button
                                onClick={() => handleEditTimes(registroHoras)}
                                className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                                title="Editar horario"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                            {/* Editar solo si no está aprobado */}
                            {!registroHoras.aprobado && (
                              <button
                                onClick={() => handleEdit(registroHoras)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                                title="Editar"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                            {/* Eliminar solo si no está aprobado */}
                            {!registroHoras.aprobado && (
                              <button
                                onClick={() => handleDelete(registroHoras)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollableTable>
        </div>

        {/* Debt History Table - Solo en vista personal */}
        {viewMode === 'personal' && <DebtHistoryTable />}

        {/* Informacion y Sugerencias - Solo en vista personal */}
        {viewMode === 'personal' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Como usar el Timer?</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ul className="text-gray-600 text-xs sm:text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">1.</span>
                  <span>Presiona "Iniciar Timer" para comenzar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">2.</span>
                  <span>Trabaja mientras el timer cuenta el tiempo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">3.</span>
                  <span>Presiona "Finalizar y Guardar" cuando termines</span>
                </li>
              </ul>
              <ul className="text-gray-600 text-xs sm:text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Si necesitas corregir el horario, usa el boton de reloj</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">5.</span>
                  <span>El admin aprobara tus horas - veras el estado en la tabla</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">6.</span>
                  <span>Si te rechazan, podras corregir y re-enviar</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Info para admins en modo equipo */}
        {viewMode === 'team' && isAdmin && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg sm:rounded-xl border border-indigo-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="text-indigo-600 h-5 w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vista de Equipo</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>Visualiza las horas de todo el equipo en tiempo real</span>
              </div>
              <div className="flex items-start gap-2">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Ve quien lidera en productividad hoy</span>
              </div>
              <div className="flex items-start gap-2">
                <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Registra tiempo para cualquier miembro del equipo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición de Tiempos */}
      <AnimatePresence>
        {timeEditModal.open && timeEditModal.record && (
          <TimeEditModal
            record={timeEditModal.record}
            onClose={() => setTimeEditModal({ open: false, record: null })}
            onSave={handleSaveTimerTimes}
            isLoading={updateTimesMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Modal de Crear Deuda */}
      <CreateDebtModal
        isOpen={showDebtModal}
        onClose={() => setShowDebtModal(false)}
      />
    </MainLayout>
  );
}

// Modal Component for editing timer times
function TimeEditModal({
  record,
  onClose,
  onSave,
  isLoading
}: {
  record: RegistroHoras;
  onClose: () => void;
  onSave: (timerInicio: string, timerFin: string) => void;
  isLoading: boolean;
}) {
  const [startTime, setStartTime] = useState(() => {
    if (record.timerInicio) {
      const date = new Date(record.timerInicio);
      return date.toISOString().slice(0, 16);
    }
    return '';
  });

  const [endTime, setEndTime] = useState(() => {
    if (record.timerFin) {
      const date = new Date(record.timerFin);
      return date.toISOString().slice(0, 16);
    }
    return '';
  });

  // Calculate hours in real-time
  const calculatedHours = useMemo(() => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Math.max(0, hours);
    }
    return 0;
  }, [startTime, endTime]);

  const hoursDiff = record.horas ? (calculatedHours - record.horas) : 0;
  const isValidTime = calculatedHours > 0 && calculatedHours <= 16;

  const handleSubmit = () => {
    if (startTime && endTime && isValidTime) {
      onSave(new Date(startTime).toISOString(), new Date(endTime).toISOString());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="text-purple-600 h-5 w-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Editar Horario</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Hora de Inicio
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Hora de Fin
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
            />
          </div>

          {/* Calculated Hours Preview */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm sm:text-base">Total calculado:</span>
              <span className={`text-xl sm:text-2xl font-bold ${isValidTime ? 'text-purple-600' : 'text-red-600'}`}>
                {calculatedHours.toFixed(2)}h
              </span>
            </div>
            {record.horas && hoursDiff !== 0 && (
              <div className={`text-sm mt-1 ${hoursDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hoursDiff > 0 ? '+' : ''}{hoursDiff.toFixed(2)}h respecto al original ({record.horas.toFixed(2)}h)
              </div>
            )}
            {record.horasOriginales && (
              <div className="text-xs text-gray-500 mt-1">
                Horas originales: {record.horasOriginales.toFixed(2)}h
              </div>
            )}
          </div>

          {/* Warnings */}
          {calculatedHours > 12 && calculatedHours <= 16 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                Mas de 12 horas. Verifica que los tiempos sean correctos.
              </span>
            </div>
          )}

          {calculatedHours > 16 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">
                Maximo permitido: 16 horas por registro.
              </span>
            </div>
          )}

          {calculatedHours < 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">
                La hora de fin debe ser posterior a la hora de inicio.
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!startTime || !endTime || !isValidTime || isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base min-h-[44px]"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
