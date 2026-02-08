'use client';

import { useState, FormEvent } from 'react';
import { X, AlertCircle, Clock, Calendar, FileText, Save } from 'lucide-react';
import { useCreateDebt } from '@/hooks/useHourDebt';
import { toast } from 'sonner';

interface CreateDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for creating a new hour debt entry
 * Allows users to register hours owed with a date and optional reason
 */
export default function CreateDebtModal({ isOpen, onClose }: CreateDebtModalProps) {
  const createDebt = useCreateDebt();
  const [formData, setFormData] = useState({
    hoursOwed: '',
    date: new Date().toISOString().split('T')[0], // Today's date by default
    reason: '',
  });

  // Don't render if modal is not open
  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate hours
    const hours = parseFloat(formData.hoursOwed);
    if (isNaN(hours) || hours < 0.1 || hours > 16) {
      toast.error('Las horas deben estar entre 0.1 y 16');
      return;
    }

    // Validate date is not in the future
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      toast.error('No puedes registrar deuda para fechas futuras');
      return;
    }

    // Convert hours to minutes
    const minutesOwed = Math.round(hours * 60);

    try {
      await createDebt.mutateAsync({
        minutesOwed,
        date: formData.date,
        reason: formData.reason || undefined,
      });

      // Reset form and close modal on success
      setFormData({
        hoursOwed: '',
        date: new Date().toISOString().split('T')[0],
        reason: '',
      });
      onClose();
    } catch (error) {
      // Error toast is handled by the hook
      console.error('Error creating debt:', error);
    }
  };

  const handleClose = () => {
    // Reset form when closing without saving
    setFormData({
      hoursOwed: '',
      date: new Date().toISOString().split('T')[0],
      reason: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Registrar Deuda de Horas
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={createDebt.isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hours Owed */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4" />
              Horas Adeudadas *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="16"
              value={formData.hoursOwed}
              onChange={(e) => setFormData({ ...formData, hoursOwed: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              placeholder="Ej: 8"
              required
              disabled={createDebt.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo 16 horas por día
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4" />
              Fecha *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              required
              disabled={createDebt.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              No puedes registrar deuda para fechas futuras
            </p>
          </div>

          {/* Reason (optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4" />
              Motivo
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              rows={3}
              placeholder="Ej: Día de ausencia justificada, permiso médico, etc."
              disabled={createDebt.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              Opcional - Ayuda a recordar el motivo de la deuda
            </p>
          </div>

          {/* Warning Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Importante:</strong> Una vez creada, solo administradores pueden modificar o eliminar esta deuda.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createDebt.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createDebt.isPending}
            >
              {createDebt.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Registrar Deuda
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
