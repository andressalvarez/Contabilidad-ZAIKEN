'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Info, MessageSquare, X } from 'lucide-react';
import { DialogRequest, subscribeAppDialog } from '@/lib/app-dialog';

function isConfirmDisabled(request: DialogRequest | null, promptValue: string) {
  if (!request) return true;
  if (request.kind !== 'prompt') return false;
  if (!request.options.required) return false;
  return promptValue.trim().length === 0;
}

export default function AppDialogProvider() {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeAppDialog((nextRequest) => {
      setRequest(nextRequest);
      setPromptValue(nextRequest.options.defaultValue || '');
    });

    return unsubscribe;
  }, []);

  const title = useMemo(() => {
    if (!request) return '';
    if (request.options.title) return request.options.title;
    if (request.kind === 'alert') return 'Aviso';
    if (request.kind === 'prompt') return 'Ingresar dato';
    return 'Confirmación';
  }, [request]);

  const closeDialog = (value: boolean | string | null) => {
    if (!request) return;
    request.resolve(value);
    setRequest(null);
    setPromptValue('');
  };

  if (!request) return null;

  const isDanger = !!request.options.danger;
  const confirmText = request.options.confirmText || (request.kind === 'alert' ? 'Entendido' : 'Confirmar');
  const cancelText = request.options.cancelText || 'Cancelar';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-2 ${isDanger ? 'bg-red-100' : 'bg-indigo-100'}`}>
              {request.kind === 'prompt' ? (
                <MessageSquare className={`h-5 w-5 ${isDanger ? 'text-red-600' : 'text-indigo-600'}`} />
              ) : request.kind === 'alert' ? (
                <Info className={`h-5 w-5 ${isDanger ? 'text-red-600' : 'text-indigo-600'}`} />
              ) : (
                <AlertTriangle className={`h-5 w-5 ${isDanger ? 'text-red-600' : 'text-indigo-600'}`} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => closeDialog(request.kind === 'prompt' ? null : false)}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="whitespace-pre-line text-sm text-gray-700">{request.options.message}</p>

          {request.kind === 'prompt' && (
            <input
              type="text"
              value={promptValue}
              onChange={(event) => setPromptValue(event.target.value)}
              placeholder={request.options.placeholder || 'Escribe aquí...'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
          {request.kind !== 'alert' && (
            <button
              type="button"
              onClick={() => closeDialog(request.kind === 'prompt' ? null : false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => closeDialog(request.kind === 'prompt' ? promptValue.trim() : true)}
            disabled={isConfirmDisabled(request, promptValue)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
