'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Clock,
  Globe,
  Monitor
} from 'lucide-react';
import { SecurityService, AuditLog, AuditLogQuery } from '@/services/security.service';

// Event type labels and colors
const EVENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  LOGIN: { label: 'Inicio de sesión', color: 'text-green-700', bg: 'bg-green-100' },
  LOGIN_FAILED: { label: 'Login fallido', color: 'text-red-700', bg: 'bg-red-100' },
  LOGOUT: { label: 'Cierre de sesión', color: 'text-blue-700', bg: 'bg-blue-100' },
  PASSWORD_CHANGE: { label: 'Cambio de contraseña', color: 'text-amber-700', bg: 'bg-amber-100' },
  USER_CREATE: { label: 'Usuario creado', color: 'text-green-700', bg: 'bg-green-100' },
  USER_UPDATE: { label: 'Usuario actualizado', color: 'text-blue-700', bg: 'bg-blue-100' },
  USER_DELETE: { label: 'Usuario eliminado', color: 'text-red-700', bg: 'bg-red-100' },
  ROLE_CREATE: { label: 'Rol creado', color: 'text-purple-700', bg: 'bg-purple-100' },
  ROLE_UPDATE: { label: 'Rol actualizado', color: 'text-purple-700', bg: 'bg-purple-100' },
  ROLE_DELETE: { label: 'Rol eliminado', color: 'text-red-700', bg: 'bg-red-100' },
  ROLE_ASSIGN: { label: 'Rol asignado', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  PERMISSION_CHANGE: { label: 'Permisos modificados', color: 'text-amber-700', bg: 'bg-amber-100' },
  SESSION_REVOKE: { label: 'Sesión revocada', color: 'text-red-700', bg: 'bg-red-100' },
  SETTINGS_UPDATE: { label: 'Configuración actualizada', color: 'text-gray-700', bg: 'bg-gray-100' },
};

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditLogQuery>({
    page: 1,
    limit: 25,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Queries
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => SecurityService.getAuditLogs(filters),
  });

  const { data: eventTypes = [] } = useQuery({
    queryKey: ['audit-event-types'],
    queryFn: SecurityService.getEventTypes,
  });

  const logs = auditData?.data || [];
  const total = auditData?.total || 0;
  const totalPages = Math.ceil(total / (filters.limit || 25));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventInfo = (eventType: string) => {
    return EVENT_LABELS[eventType] || { label: eventType, color: 'text-gray-700', bg: 'bg-gray-100' };
  };

  const handleExport = () => {
    // Export functionality can be implemented with backend endpoint
    const csvContent = [
      ['ID', 'Fecha', 'Usuario', 'Evento', 'Descripción', 'IP'].join(','),
      ...logs.map(log => [
        log.id,
        formatDate(log.createdAt),
        log.user?.email || 'Sistema',
        log.eventType,
        `"${log.description.replace(/"/g, '""')}"`,
        log.ipAddress || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={28} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Registro de Auditoría</h1>
            </div>
            <p className="text-gray-600 ml-12">
              Historial de eventos de seguridad y actividades del sistema
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors shadow-sm ${
                showFilters
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Activity className="h-4 w-4" />
                Tipo de Evento
              </label>
              <select
                value={filters.eventType || ''}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value || undefined, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">Todos los eventos</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {getEventInfo(type).label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                Desde
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                Hasta
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ page: 1, limit: 25 })}
                className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Activity className="text-gray-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Eventos ({total})
            </h2>
          </div>
          <div className="text-sm text-gray-500">
            Página {filters.page} de {totalPages || 1}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay registros
            </h3>
            <p className="text-gray-600">
              No se encontraron eventos con los filtros seleccionados
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => {
                    const eventInfo = getEventInfo(log.eventType);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-indigo-100 rounded">
                                <User className="h-3.5 w-3.5 text-indigo-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {log.user.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {log.user.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Sistema</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventInfo.bg} ${eventInfo.color}`}>
                            {eventInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 max-w-xs truncate">
                            {log.description}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.ipAddress && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Globe className="h-3.5 w-3.5" />
                              {log.ipAddress}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando {((filters.page || 1) - 1) * (filters.limit || 25) + 1} -{' '}
                {Math.min((filters.page || 1) * (filters.limit || 25), total)} de {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="text-blue-600" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalle del Evento
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">ID</label>
                  <p className="text-gray-900">#{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Fecha</label>
                  <p className="text-gray-900">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Tipo de Evento</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventInfo(selectedLog.eventType).bg} ${getEventInfo(selectedLog.eventType).color}`}>
                    {getEventInfo(selectedLog.eventType).label}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Usuario</label>
                <p className="text-gray-900">
                  {selectedLog.user ? `${selectedLog.user.nombre} (${selectedLog.user.email})` : 'Sistema'}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Descripción</label>
                <p className="text-gray-900">{selectedLog.description}</p>
              </div>

              {selectedLog.targetType && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Entidad Afectada</label>
                    <p className="text-gray-900">{selectedLog.targetType}</p>
                  </div>
                  {selectedLog.targetId && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">ID Entidad</label>
                      <p className="text-gray-900">#{selectedLog.targetId}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedLog.ipAddress && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Dirección IP
                    </label>
                    <p className="text-gray-900">{selectedLog.ipAddress}</p>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      Navegador
                    </label>
                    <p className="text-gray-900 text-sm truncate" title={selectedLog.userAgent}>
                      {selectedLog.userAgent.substring(0, 50)}...
                    </p>
                  </div>
                )}
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Datos Adicionales</label>
                  <pre className="mt-1 p-3 bg-gray-100 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
