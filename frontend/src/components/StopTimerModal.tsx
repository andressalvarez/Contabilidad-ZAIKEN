'use client';

import React, { useState, useMemo } from 'react';
import { RegistroHorasService } from '@/services';
import { X, Save, Clock, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { RegistroHoras } from '@/types';
import { motion } from 'framer-motion';

interface StopTimerModalProps {
  activeTimer: RegistroHoras;
  onClose: () => void;
  onSuccess?: (savedRecord: RegistroHoras) => void;
}

/**
 * Modal to stop the timer and save the time record
 * Allows adding a final description before saving
 *
 * @example
 * <StopTimerModal
 *   activeTimer={timer}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => refetch()}
 * />
 */
export const StopTimerModal: React.FC<StopTimerModalProps> = ({
  activeTimer,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [descripcion, setDescripcion] = useState(activeTimer.descripcion || '');

  // Initialize start and end times from activeTimer
  const formatDateTimeLocal = (date: string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [startTime, setStartTime] = useState(
    formatDateTimeLocal(activeTimer.timerInicio) || formatDateTimeLocal(new Date().toISOString())
  );
  const [endTime, setEndTime] = useState(
    formatDateTimeLocal(new Date().toISOString())
  );

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

  const isValidTime = calculatedHours > 0 && calculatedHours <= 16;

  // Format elapsed time
  const formatTime = (hours: number): string => {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate times
    if (!startTime || !endTime) {
      toast.error('Debe especificar hora de inicio y fin');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    console.log('⏰ Datos del timer:', {
      timerId: activeTimer.id,
      startTime,
      endTime,
      start: start.toISOString(),
      end: end.toISOString(),
      diffHours: (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    });

    if (end <= start) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    try {
      setLoading(true);
      const savedRecord = await RegistroHorasService.stopTimer(
        activeTimer.id,
        descripcion,
        start.toISOString(),
        end.toISOString()
      );
      toast.success('Timer detenido y registro guardado');
      onSuccess?.(savedRecord);
      onClose();
    } catch (error: any) {
      console.error('❌ Error al detener timer:', error);
      toast.error(error.message || 'Error al detener timer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
      >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-xl">
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Finalizar Registro de Tiempo
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Revisa y ajusta los horarios antes de guardar
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Tiempo calculado con preview en tiempo real */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-xl p-6 border-2 border-indigo-200">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Clock className="text-indigo-600" size={20} />
                  <p className="text-sm font-medium text-gray-700">
                    Tiempo Total Calculado
                  </p>
                </div>
                <motion.div
                  key={calculatedHours}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`text-5xl font-bold font-mono mb-2 ${
                    isValidTime ? 'text-indigo-600' : 'text-red-600'
                  }`}
                >
                  {formatTime(calculatedHours)}
                </motion.div>
                <p className="text-sm text-gray-600">
                  {calculatedHours.toFixed(2)} horas decimales
                </p>
                {!isValidTime && calculatedHours > 16 && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    <span>Máximo permitido: 16 horas</span>
                  </div>
                )}
              </div>
            </div>

              {/* Campaña (si existe) */}
              {activeTimer.campana && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="text-purple-600" size={16} />
                    <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                      Campaña
                    </p>
                  </div>
                  <p className="text-base font-semibold text-purple-900">
                    {activeTimer.campana.nombre}
                  </p>
                </div>
              )}

              {/* Horarios */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ajustar Horario
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Hora de Inicio *
                    </label>
                    <input
                      type="datetime-local"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endTime"
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Hora de Fin *
                    </label>
                    <input
                      type="datetime-local"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label
                  htmlFor="descripcion"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Descripción del trabajo realizado
                </label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe brevemente lo que trabajaste..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-vertical bg-white"
                />
              </div>

              {/* Información adicional */}
              <div className="flex items-start gap-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Registro pendiente de aprobación</p>
                  <p className="text-amber-700">
                    Una vez aprobado por un administrador, este registro se contabilizará en las métricas del sistema.
                  </p>
                </div>
              </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <motion.button
                type="submit"
                disabled={loading || !isValidTime}
                whileHover={{ scale: loading || !isValidTime ? 1 : 1.02 }}
                whileTap={{ scale: loading || !isValidTime ? 1 : 0.98 }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  loading || !isValidTime
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg'
                }`}
              >
                <Save size={18} />
                {loading ? 'Guardando...' : 'Guardar Registro'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
  );
};
