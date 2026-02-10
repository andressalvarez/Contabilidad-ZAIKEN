'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bug,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  RotateCcw,
  Search,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useBugReports, useUpdateBugReportStatus } from '@/hooks/useBugReports';
import { useDebounce } from '@/hooks/useDebounce';
import type { BugReport, BugReportStatus } from '@/services/bug-reports.service';

const STATUS_LABELS: Record<BugReportStatus, string> = {
  OPEN: 'Pendiente',
  RESOLVED: 'Resuelto',
};

const STATUS_BADGE: Record<BugReportStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
};

type StatusFilter = 'ALL' | BugReportStatus;

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(value: string, max = 55): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function nextStatus(status: BugReportStatus): BugReportStatus {
  return status === 'OPEN' ? 'RESOLVED' : 'OPEN';
}

function statusActionLabel(status: BugReportStatus): string {
  return status === 'OPEN' ? 'Marcar resuelto' : 'Reabrir';
}

export default function FeedbackAdminPage() {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const limit = 20;

  const debouncedSearch = useDebounce(searchInput.trim(), 350);
  const updateStatusMutation = useUpdateBugReportStatus();

  const queryStatus = useMemo(
    () => (statusFilter === 'ALL' ? undefined : statusFilter),
    [statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, queryStatus]);

  const { data, isLoading, isFetching } = useBugReports({
    status: queryStatus,
    search: debouncedSearch || undefined,
    page,
    limit,
  });

  const reports = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1, limit };

  const handleToggleStatus = async (report: BugReport) => {
    await updateStatusMutation.mutateAsync({
      id: report.id,
      status: nextStatus(report.status),
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bug className="text-red-600" size={26} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Feedback de Bugs</h1>
              </div>
              <p className="text-gray-600 ml-12">
                Reportes de usuarios con evidencia y modulo detectado automaticamente
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Buscar
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Descripcion, URL o usuario..."
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Estado
              </label>
              <div className="relative">
                <Filter className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Todos</option>
                  <option value="OPEN">Pendiente</option>
                  <option value="RESOLVED">Resuelto</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Reportes ({meta.total})
            </h2>
            {isFetching && <span className="text-sm text-gray-500">Actualizando...</span>}
          </div>

          {isLoading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center">
              <Bug className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No hay reportes para los filtros actuales.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripcion</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modulo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evidencia</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">
                            {report.reporter?.nombre || 'Usuario'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {report.reporter?.email || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                          <p title={report.description}>{truncate(report.description, 95)}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                          {report.moduleUrl !== 'unknown' ? (
                            <a
                              href={report.moduleUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                              title={report.moduleUrl}
                            >
                              {truncate(report.moduleUrl, 45)}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-gray-500">unknown</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {report.evidenceUrl ? (
                            <a
                              href={report.evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                            >
                              Ver captura
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-gray-500 italic">Sin evidencia</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[report.status]}`}
                          >
                            {STATUS_LABELS[report.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(report)}
                            disabled={updateStatusMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {report.status === 'OPEN' ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            {statusActionLabel(report.status)}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Pagina {meta.page} de {Math.max(meta.totalPages, 1)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={meta.page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(Math.max(meta.totalPages, 1), current + 1),
                      )
                    }
                    disabled={meta.page >= Math.max(meta.totalPages, 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
