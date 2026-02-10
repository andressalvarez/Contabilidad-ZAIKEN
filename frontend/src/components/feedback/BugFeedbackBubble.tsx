'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bug, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { useCreateBugReport } from '@/hooks/useBugReports';

function isLightshotUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    return hostname === 'prnt.sc' || hostname === 'prntscr.com';
  } catch {
    return false;
  }
}

export default function BugFeedbackBubble() {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const createBugReport = useCreateBugReport();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const isAuthRoute = useMemo(
    () => pathname === '/login' || pathname === '/register',
    [pathname],
  );

  if (loading) return null;
  if (!user || isAuthRoute) return null;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedDescription = description.trim();
    const normalizedEvidenceUrl = evidenceUrl.trim();

    if (!normalizedDescription) {
      toast.error('La descripcion es obligatoria');
      return;
    }

    // Validar URL de Lightshot solo si se proporciona
    if (normalizedEvidenceUrl && !isLightshotUrl(normalizedEvidenceUrl)) {
      toast.error('La evidencia debe ser una URL de Lightshot (prnt.sc o prntscr.com)');
      return;
    }

    await createBugReport.mutateAsync({
      description: normalizedDescription,
      evidenceUrl: normalizedEvidenceUrl || undefined,
      moduleUrl: window.location.href,
    });

    setDescription('');
    setEvidenceUrl('');
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Reportar bug"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 transition-colors flex items-center justify-center"
      >
        {open ? <X className="h-6 w-6" /> : <Bug className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-24px)] rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Reportar fallo</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 p-4">
            <div>
              <label htmlFor="bug-description" className="mb-1 block text-xs font-medium text-gray-700">
                Descripcion del bug
              </label>
              <textarea
                id="bug-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Que fallo encontraste y como reproducirlo..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div>
              <label htmlFor="bug-evidence" className="mb-1 block text-xs font-medium text-gray-700">
                URL de evidencia (Lightshot) - Opcional
              </label>
              <input
                id="bug-evidence"
                type="url"
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
                placeholder="https://prnt.sc/... (opcional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={createBugReport.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {createBugReport.isPending ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
