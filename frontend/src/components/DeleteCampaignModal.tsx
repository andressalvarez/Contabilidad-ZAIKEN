'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteCampaignModalProps {
  campaignName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

/**
 * Modal de confirmación para eliminar una campaña
 * Muestra advertencias sobre las consecuencias de la eliminación
 *
 * @example
 * const [showDelete, setShowDelete] = useState(false);
 *
 * {showDelete && (
 *   <DeleteCampaignModal
 *     campaignName="Campaña Q1"
 *     onConfirm={() => {
 *       deleteCampana(id);
 *       setShowDelete(false);
 *     }}
 *     onCancel={() => setShowDelete(false)}
 *     isDeleting={isDeleting}
 *   />
 * )}
 */
export const DeleteCampaignModal: React.FC<DeleteCampaignModalProps> = ({
  campaignName,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const confirmationWord = 'ELIMINAR';
  const isConfirmed = confirmText === confirmationWord;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={!isDeleting ? onCancel : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
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
            animation: 'slideUp 0.2s ease',
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
              backgroundColor: '#FEF2F2',
              borderTopLeftRadius: '0.75rem',
              borderTopRightRadius: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  borderRadius: '50%',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={24} style={{ color: '#DC2626' }} />
              </div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#DC2626',
                  margin: 0,
                }}
              >
                Eliminar Campaña
              </h2>
            </div>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                padding: '0.25rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
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
          <div style={{ padding: '1.5rem' }}>
            {/* Mensaje de advertencia */}
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#7F1D1D',
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                  ⚠️ Acción Permanente
                </strong>
                Esta acción NO se puede deshacer. Se eliminarán permanentemente:
              </p>
            </div>

            {/* Lista de consecuencias */}
            <div
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.5rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  lineHeight: '1.75',
                }}
              >
                <li>
                  La campaña <strong>"{campaignName}"</strong>
                </li>
                <li>Todos los registros de horas asociados</li>
                <li>Todas las transacciones relacionadas</li>
                <li>Métricas e histórico de la campaña</li>
              </ul>
            </div>

            {/* Campo de confirmación */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="confirmDelete"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}
              >
                Para confirmar, escribe{' '}
                <code
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontWeight: '600',
                  }}
                >
                  {confirmationWord}
                </code>
              </label>
              <input
                id="confirmDelete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={`Escribe ${confirmationWord}`}
                disabled={isDeleting}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: isDeleting ? '#F9FAFB' : 'white',
                }}
                onFocus={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.borderColor = '#DC2626';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                autoFocus
              />
            </div>

            {/* Nota final */}
            <div
              style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FCD34D',
                borderRadius: '0.5rem',
                padding: '0.75rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#92400E',
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                <strong>💡 Consejo:</strong> Si solo deseas ocultar temporalmente esta
                campaña, considera desactivarla en lugar de eliminarla.
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
              backgroundColor: '#F9FAFB',
              borderBottomLeftRadius: '0.75rem',
              borderBottomRightRadius: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
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
              type="button"
              onClick={onConfirm}
              disabled={!isConfirmed || isDeleting}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor:
                  !isConfirmed || isDeleting ? '#9CA3AF' : '#DC2626',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                cursor: !isConfirmed || isDeleting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (isConfirmed && !isDeleting) {
                  e.currentTarget.style.backgroundColor = '#B91C1C';
                }
              }}
              onMouseLeave={(e) => {
                if (isConfirmed && !isDeleting) {
                  e.currentTarget.style.backgroundColor = '#DC2626';
                }
              }}
            >
              <Trash2 size={16} />
              {isDeleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
