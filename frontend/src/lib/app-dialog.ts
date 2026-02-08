'use client';

export type DialogKind = 'alert' | 'confirm' | 'prompt';

export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface DialogRequest {
  kind: DialogKind;
  options: DialogOptions;
  resolve: (value: boolean | string | null) => void;
}

const EVENT_NAME = 'zaiken:app-dialog';

function dispatchDialog(kind: DialogKind, options: DialogOptions): Promise<boolean | string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(kind === 'prompt' ? null : false);
      return;
    }

    const request: DialogRequest = { kind, options, resolve };
    window.dispatchEvent(new CustomEvent<DialogRequest>(EVENT_NAME, { detail: request }));
  });
}

export async function showConfirm(options: DialogOptions): Promise<boolean> {
  const result = await dispatchDialog('confirm', options);
  return result === true;
}

export async function showAlert(options: DialogOptions): Promise<void> {
  await dispatchDialog('alert', options);
}

export async function showPrompt(options: DialogOptions): Promise<string | null> {
  const result = await dispatchDialog('prompt', options);
  return typeof result === 'string' ? result : null;
}

export function subscribeAppDialog(listener: (request: DialogRequest) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<DialogRequest>;
    if (customEvent.detail) {
      listener(customEvent.detail);
    }
  };

  window.addEventListener(EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
}
