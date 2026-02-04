'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useUser } from '@/hooks/useUser';
import { StopTimerModal } from './StopTimerModal';
import { Play, Pause, Square, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface TimerWidgetProps {
  personaId?: number;
  onStop?: () => void;
}

/**
 * Widget flotante para controlar el timer de horas
 * Se muestra cuando hay un timer activo
 *
 * @example
 * <TimerWidget personaId={1} onStop={() => refetch()} />
 */
export const TimerWidget: React.FC<TimerWidgetProps> = ({ personaId, onStop }) => {
  const { user } = useUser();
  const {
    activeTimer,
    isRunning,
    isPaused,
    elapsedTime,
    loading,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    refreshTimer,
  } = useTimer();

  const [showStopModal, setShowStopModal] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Cargar timer activo al montar el componente
  useEffect(() => {
    if (personaId) {
      refreshTimer(personaId);
    }
  }, [personaId, refreshTimer]);

  // Refrescar cada 30 segundos
  useEffect(() => {
    if (!personaId) return;

    const interval = setInterval(() => {
      refreshTimer(personaId);
    }, 30000);

    return () => clearInterval(interval);
  }, [personaId, refreshTimer]);

  // Formatear tiempo transcurrido
  const formatTime = (hours: number): string => {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const s = Math.floor((hours * 3600) % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = async () => {
    try {
      if (isRunning) {
        await pauseTimer();
        toast.success('Timer pausado');
      } else if (isPaused) {
        await resumeTimer();
        toast.success('Timer reanudado');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al pausar/reanudar timer');
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Está seguro de cancelar este timer? Se perderá el registro.')) {
      return;
    }

    try {
      await cancelTimer();
      toast.success('Timer cancelado');
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar timer');
    }
  };

  // No mostrar si no hay timer activo
  if (!activeTimer) {
    return null;
  }

  const widgetBgColor = isRunning ? 'bg-green-500' : isPaused ? 'bg-amber-500' : 'bg-gray-600';
  const widgetBgHover = isRunning ? 'hover:bg-green-600' : isPaused ? 'hover:bg-amber-600' : 'hover:bg-gray-700';

  return (
    <>
      {/* Widget flotante */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`fixed ${minimized ? 'bottom-4' : 'bottom-8'} right-8 ${widgetBgColor} text-white rounded-xl shadow-2xl z-50 ${minimized ? 'w-48' : 'w-80'} transition-all duration-300`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 flex items-center justify-between ${!minimized && 'border-b border-white/20'} cursor-pointer ${widgetBgHover} rounded-t-xl transition-colors`}
          onClick={() => setMinimized(!minimized)}
        >
          <div className="flex items-center gap-2">
            <Clock size={18} strokeWidth={2.5} />
            <span className="font-semibold text-sm">
              {isRunning ? 'En progreso' : isPaused ? 'Pausado' : 'Timer'}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(!minimized);
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!minimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-6">
                {/* Reloj animado central */}
                <div className="flex flex-col items-center mb-6">
                  <motion.div
                    animate={{
                      rotate: isRunning ? 360 : 0
                    }}
                    transition={{
                      duration: 2,
                      repeat: isRunning ? Infinity : 0,
                      ease: "linear"
                    }}
                    className="relative w-24 h-24 mb-4"
                  >
                    <Clock
                      size={96}
                      strokeWidth={1.5}
                      className="text-white drop-shadow-lg"
                    />
                  </motion.div>

                  {/* Tiempo transcurrido */}
                  <motion.div
                    key={formatTime(elapsedTime)}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-4xl font-bold font-mono tracking-wider mb-2"
                  >
                    {formatTime(elapsedTime)}
                  </motion.div>

                  {/* Descripción */}
                  {activeTimer.descripcion && (
                    <p className="text-sm opacity-90 text-center px-2">
                      {activeTimer.descripcion}
                    </p>
                  )}
                </div>

                {/* Botones de control circulares */}
                <div className="flex justify-center items-center gap-3">
                  {/* Pausar/Reanudar */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePauseResume}
                    disabled={loading}
                    className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title={isRunning ? 'Pausar' : 'Reanudar'}
                  >
                    {isRunning ? <Pause size={28} strokeWidth={2.5} /> : <Play size={28} strokeWidth={2.5} className="ml-1" />}
                    <span className="text-xs mt-1 font-medium">
                      {isRunning ? 'Pausar' : 'Reanudar'}
                    </span>
                  </motion.button>

                  {/* Detener */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowStopModal(true)}
                    disabled={loading}
                    className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Detener"
                  >
                    <Square size={28} strokeWidth={2.5} />
                    <span className="text-xs mt-1 font-medium">Detener</span>
                  </motion.button>

                  {/* Cancelar */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-red-500/40 hover:bg-red-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Cancelar"
                  >
                    <X size={28} strokeWidth={2.5} />
                    <span className="text-xs mt-1 font-medium">Cancelar</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimized view */}
        {minimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-2 text-xl font-bold font-mono text-center"
          >
            {formatTime(elapsedTime)}
          </motion.div>
        )}
      </motion.div>

      {/* Modal para detener */}
      {showStopModal && (
        <StopTimerModal
          activeTimer={activeTimer}
          onClose={() => setShowStopModal(false)}
          onSuccess={() => {
            setShowStopModal(false);
            onStop?.();
          }}
        />
      )}
    </>
  );
};
