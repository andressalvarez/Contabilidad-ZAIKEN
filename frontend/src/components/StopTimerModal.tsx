'use client';

import React, { useState } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RegistroHoras } from '@/types';

interface StopTimerModalProps {
  activeTimer: RegistroHoras;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal para detener el timer y guardar el registro de horas
 * Permite agregar una descripción final antes de guardar
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
  const { stopTimer, loading, elapsedTime } = useTimer();
  const [descripcion, setDescripcion] = useState(activeTimer.descripcion || '');

  // Formatear tiempo transcurrido
  const formatTime = (hours: number): string => {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await stopTimer(descripcion);
      toast.success('Timer detenido y registro guardado');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Error al detener timer');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.5rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
              }}
            >
              Detener Timer
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '0.25rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                  e.currentTarget.style.color = '#111827';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6B7280';
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '1.5rem' }}>
              {/* Tiempo transcurrido */}
              <div
                style={{
                  backgroundColor: '#F3F4F6',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#6B7280',
                    marginBottom: '0.5rem',
                  }}
                >
                  Tiempo total trabajado:
                </p>
                <p
                  style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#111827',
                    fontFamily: 'monospace',
                    margin: 0,
                  }}
                >
                  {formatTime(elapsedTime)}
                </p>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginTop: '0.25rem',
                  }}
                >
                  {elapsedTime.toFixed(2)} horas
                </p>
              </div>

              {/* Campaña (si existe) */}
              {activeTimer.campana && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#6B7280',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Campaña:
                  </p>
                  <p
                    style={{
                      fontSize: '1rem',
                      color: '#111827',
                      fontWeight: '500',
                      margin: 0,
                    }}
                  >
                    {activeTimer.campana.nombre}
                  </p>
                </div>
              )}

              {/* Descripción */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="descripcion"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem',
                  }}
                >
                  Descripción del trabajo realizado
                </label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe brevemente lo que trabajaste..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Información adicional */}
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#92400E',
                    margin: 0,
                  }}
                >
                  <strong>Nota:</strong> Este registro quedará pendiente de
                  aprobación. Una vez aprobado, se contabilizará en las métricas.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#3B82F6';
                  }
                }}
              >
                <Save size={16} />
                {loading ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
