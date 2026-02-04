'use client';

import { useState, useEffect, useCallback } from 'react';
import { RegistroHorasService } from '@/services';
import { RegistroHoras } from '@/types';

export interface UseTimerReturn {
  activeTimer: RegistroHoras | null;
  isRunning: boolean;
  isPaused: boolean;
  loading: boolean;
  error: string | null;
  elapsedTime: number;
  startTimer: (personaId: number, campanaId?: number, descripcion?: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: (descripcion?: string) => Promise<void>;
  cancelTimer: () => Promise<void>;
  refreshTimer: (personaId: number) => Promise<void>;
}

/**
 * Hook para gestionar el timer de registro de horas
 *
 * @example
 * const {
 *   activeTimer,
 *   isRunning,
 *   elapsedTime,
 *   startTimer,
 *   pauseTimer,
 *   stopTimer
 * } = useTimer();
 *
 * // Iniciar timer
 * await startTimer(personaId, campanaId, 'Trabajando en tarea X');
 *
 * // Pausar timer
 * await pauseTimer();
 *
 * // Detener timer
 * await stopTimer('Tarea completada');
 */
export function useTimer(): UseTimerReturn {
  const [activeTimer, setActiveTimer] = useState<RegistroHoras | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const isRunning = activeTimer?.estado === 'RUNNING';
  const isPaused = activeTimer?.estado === 'PAUSADO';

  // Calcular tiempo transcurrido
  useEffect(() => {
    if (!activeTimer || !isRunning) return;

    const interval = setInterval(() => {
      const start = new Date(activeTimer.timerInicio!).getTime();
      const now = Date.now();
      const elapsed = (now - start) / (1000 * 60 * 60); // Horas
      setElapsedTime(activeTimer.horas + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, isRunning]);

  // Actualizar tiempo pausado
  useEffect(() => {
    if (isPaused && activeTimer) {
      setElapsedTime(activeTimer.horas);
    }
  }, [isPaused, activeTimer]);

  // Obtener timer activo
  const refreshTimer = useCallback(async (personaId: number) => {
    try {
      setLoading(true);
      setError(null);
      const timer = await RegistroHorasService.getActiveTimer(personaId);
      setActiveTimer(timer);
      if (timer) {
        setElapsedTime(timer.horas);
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener el timer activo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar timer
  const startTimer = useCallback(async (
    personaId: number,
    campanaId?: number,
    descripcion?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const timer = await RegistroHorasService.startTimer({
        personaId,
        campanaId,
        descripcion,
      });
      setActiveTimer(timer);
      setElapsedTime(0);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar el timer');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Pausar timer
  const pauseTimer = useCallback(async () => {
    if (!activeTimer) {
      setError('No hay timer activo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const timer = await RegistroHorasService.pauseTimer(activeTimer.id);
      setActiveTimer(timer);
    } catch (err: any) {
      setError(err.message || 'Error al pausar el timer');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeTimer]);

  // Reanudar timer
  const resumeTimer = useCallback(async () => {
    if (!activeTimer) {
      setError('No hay timer activo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const timer = await RegistroHorasService.resumeTimer(activeTimer.id);
      setActiveTimer(timer);
    } catch (err: any) {
      setError(err.message || 'Error al reanudar el timer');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeTimer]);

  // Detener timer
  const stopTimer = useCallback(async (descripcion?: string) => {
    if (!activeTimer) {
      setError('No hay timer activo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await RegistroHorasService.stopTimer(activeTimer.id, descripcion);
      setActiveTimer(null);
      setElapsedTime(0);
    } catch (err: any) {
      setError(err.message || 'Error al detener el timer');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeTimer]);

  // Cancelar timer
  const cancelTimer = useCallback(async () => {
    if (!activeTimer) {
      setError('No hay timer activo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await RegistroHorasService.cancelTimer(activeTimer.id);
      setActiveTimer(null);
      setElapsedTime(0);
    } catch (err: any) {
      setError(err.message || 'Error al cancelar el timer');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeTimer]);

  return {
    activeTimer,
    isRunning,
    isPaused,
    loading,
    error,
    elapsedTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    cancelTimer,
    refreshTimer,
  };
}
