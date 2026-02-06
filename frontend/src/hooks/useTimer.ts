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
  startTimer: (usuarioId: number, campanaId?: number, descripcion?: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: (descripcion?: string, timerInicio?: string, timerFin?: string) => Promise<void>;
  cancelTimer: () => Promise<void>;
  refreshTimer: (usuarioId: number) => Promise<void>;
}

/**
 * Hook to manage the time tracking timer
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
 * // Start timer
 * await startTimer(userId, campaignId, 'Working on task X');
 *
 * // Pause timer
 * await pauseTimer();
 *
 * // Stop timer
 * await stopTimer('Task completed');
 */
export function useTimer(): UseTimerReturn {
  const [activeTimer, setActiveTimer] = useState<RegistroHoras | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const isRunning = activeTimer?.estado === 'RUNNING';
  const isPaused = activeTimer?.estado === 'PAUSADO';

  // Calculate elapsed time
  useEffect(() => {
    if (!activeTimer || !isRunning) return;

    const interval = setInterval(() => {
      const start = new Date(activeTimer.timerInicio!).getTime();
      const now = Date.now();
      const elapsed = (now - start) / (1000 * 60 * 60); // Hours
      setElapsedTime(activeTimer.horas + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, isRunning]);

  // Update paused time
  useEffect(() => {
    if (isPaused && activeTimer) {
      setElapsedTime(activeTimer.horas);
    }
  }, [isPaused, activeTimer]);

  // Get active timer
  const refreshTimer = useCallback(async (usuarioId: number) => {
    try {
      setLoading(true);
      setError(null);
      const timer = await RegistroHorasService.getActiveTimerByUsuario(usuarioId);
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

  // Start timer
  const startTimer = useCallback(async (
    usuarioId: number,
    campanaId?: number,
    descripcion?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const timer = await RegistroHorasService.startTimer({
        usuarioId,
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

  // Pause timer
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

  // Resume timer
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

  // Stop timer
  const stopTimer = useCallback(async (
    descripcion?: string,
    timerInicio?: string,
    timerFin?: string
  ) => {
    if (!activeTimer) {
      setError('No hay timer activo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await RegistroHorasService.stopTimer(activeTimer.id, descripcion, timerInicio, timerFin);
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

  // Cancel timer
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
