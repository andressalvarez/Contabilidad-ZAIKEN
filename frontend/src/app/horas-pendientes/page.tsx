'use client';

import { useState, useEffect } from 'react';
import { RegistroHorasService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Check, X, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RegistroHoras } from '@/types';
import { Can, useCan } from '@/components/Can';
import { Action } from '@/contexts/AbilityContext';

export default function HorasPendientesPage() {
  const [pendingRecords, setPendingRecords] = useState<RegistroHoras[]>([]);
  const [rejectedRecords, setRejectedRecords] = useState<RegistroHoras[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const canApprove = useCan(Action.Approve, 'RegistroHoras');

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, rejected] = await Promise.all([
        RegistroHorasService.getPending(),
        RegistroHorasService.getRejected(),
      ]);
      setPendingRecords(pending);
      setRejectedRecords(rejected);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Approve record
  const handleApprove = async (id: number) => {
    if (!confirm('¿Está seguro de aprobar este registro de horas?')) {
      return;
    }

    try {
      await RegistroHorasService.approve(id);
      toast.success('Registro aprobado exitosamente');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar registro');
    }
  };

  // Reject record
  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      toast.error('Debe ingresar un motivo de rechazo');
      return;
    }

    try {
      await RegistroHorasService.reject(id, rejectReason);
      toast.success('Registro rechazado');
      setRejectingId(null);
      setRejectReason('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar registro');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format hours
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Format time range
  const formatTimeRange = (startTime: string | null | undefined, endTime: string | null | undefined) => {
    if (!startTime || !endTime) return null;

    const start = new Date(startTime);
    const end = new Date(endTime);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  if (!canApprove) {
    return (
      <MainLayout>
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={64} style={{ color: '#EF4444', margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            Acceso Denegado
          </h1>
          <p style={{ color: '#6B7280' }}>
            No tienes permisos para aprobar registros de horas.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div
          style={{
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '0.5rem',
              }}
            >
              Aprobación de Horas
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              Revisa y aprueba los registros de horas de tu equipo
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '0.625rem 1rem',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            borderBottom: '2px solid #E5E7EB',
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
          }}
        >
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === 'pending' ? '2px solid #3B82F6' : '2px solid transparent',
              color: activeTab === 'pending' ? '#3B82F6' : '#6B7280',
              fontWeight: activeTab === 'pending' ? '600' : '500',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            Pendientes ({pendingRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === 'rejected' ? '2px solid #EF4444' : '2px solid transparent',
              color: activeTab === 'rejected' ? '#EF4444' : '#6B7280',
              fontWeight: activeTab === 'rejected' ? '600' : '500',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            Rechazados ({rejectedRecords.length})
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <RefreshCw
              size={48}
              style={{ color: '#3B82F6', margin: '0 auto', animation: 'spin 1s linear infinite' }}
            />
            <p style={{ color: '#6B7280', marginTop: '1rem' }}>Cargando registros...</p>
          </div>
        )}

        {/* Registros Pendientes */}
        {!loading && activeTab === 'pending' && (
          <div>
            {pendingRecords.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '0.75rem',
                }}
              >
                <Clock size={48} style={{ color: '#9CA3AF', margin: '0 auto 1rem' }} />
                <p style={{ color: '#6B7280' }}>No hay registros pendientes de aprobación</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {pendingRecords.map((record) => (
                  <div
                    key={record.id}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '1rem',
                        alignItems: 'start',
                      }}
                    >
                      {/* Información */}
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                            {record.persona?.nombre || 'Persona desconocida'}
                          </h3>
                          <span
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: '700',
                              color: '#3B82F6',
                              fontFamily: 'monospace',
                            }}
                          >
                            {formatHours(record.horas)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.75rem',
                            fontSize: '0.875rem',
                            color: '#6B7280',
                          }}
                        >
                          <div>
                            <strong>Fecha:</strong> {formatDate(record.fecha)}
                          </div>
                          {record.origen === 'TIMER' && formatTimeRange(record.timerInicio, record.timerFin) && (
                            <div style={{ color: '#3B82F6', fontWeight: '600' }}>
                              <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                              <strong>Horario:</strong> {formatTimeRange(record.timerInicio, record.timerFin)}
                            </div>
                          )}
                          {record.campana && (
                            <div>
                              <strong>Campaña:</strong> {record.campana.nombre}
                            </div>
                          )}
                          <div>
                            <strong>Origen:</strong>{' '}
                            {record.origen === 'TIMER' ? 'Timer automático' : 'Manual'}
                          </div>
                        </div>
                        {record.descripcion && (
                          <p
                            style={{
                              marginTop: '0.75rem',
                              color: '#374151',
                              fontSize: '0.875rem',
                            }}
                          >
                            {record.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {rejectingId === record.id ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem',
                              minWidth: '250px',
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Motivo del rechazo..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              style={{
                                padding: '0.5rem',
                                border: '1px solid #D1D5DB',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                              }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleReject(record.id)}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  backgroundColor: '#EF4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.875rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectReason('');
                                }}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  backgroundColor: '#6B7280',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.875rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(record.id)}
                              style={{
                                padding: '0.625rem 1rem',
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <Check size={16} />
                              Aprobar
                            </button>
                            <button
                              onClick={() => setRejectingId(record.id)}
                              style={{
                                padding: '0.625rem 1rem',
                                backgroundColor: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <X size={16} />
                              Rechazar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Registros Rechazados */}
        {!loading && activeTab === 'rejected' && (
          <div>
            {rejectedRecords.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '0.75rem',
                }}
              >
                <AlertCircle size={48} style={{ color: '#9CA3AF', margin: '0 auto 1rem' }} />
                <p style={{ color: '#6B7280' }}>No hay registros rechazados</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {rejectedRecords.map((record) => (
                  <div
                    key={record.id}
                    style={{
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                          {record.persona?.nombre || 'Persona desconocida'}
                        </h3>
                        <span
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: '#EF4444',
                            fontFamily: 'monospace',
                          }}
                        >
                          {formatHours(record.horas)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          fontSize: '0.875rem',
                          color: '#6B7280',
                        }}
                      >
                        <div>
                          <strong>Fecha:</strong> {formatDate(record.fecha)}
                        </div>
                        {record.origen === 'TIMER' && formatTimeRange(record.timerInicio, record.timerFin) && (
                          <div style={{ color: '#EF4444', fontWeight: '600' }}>
                            <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                            <strong>Horario:</strong> {formatTimeRange(record.timerInicio, record.timerFin)}
                          </div>
                        )}
                        {record.campana && (
                          <div>
                            <strong>Campaña:</strong> {record.campana.nombre}
                          </div>
                        )}
                      </div>
                    </div>
                    {record.descripcion && (
                      <p
                        style={{
                          marginBottom: '0.75rem',
                          color: '#374151',
                          fontSize: '0.875rem',
                        }}
                      >
                        {record.descripcion}
                      </p>
                    )}
                    <div
                      style={{
                        backgroundColor: '#FEE2E2',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                      }}
                    >
                      <strong style={{ color: '#DC2626', fontSize: '0.875rem' }}>
                        Motivo de rechazo:
                      </strong>
                      <p style={{ color: '#7F1D1D', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                        {record.motivoRechazo || 'No especificado'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
