import { logAuditEvent } from '@/lib/rpc';

/** Send a short, non-sensitive description of a front-end crash to the audit log (signed-in users only). */
export function reportClientError(error: unknown, source: string): void {
  const e = error as { message?: string; stack?: string } | undefined;
  logAuditEvent('client_error', {
    source,
    message: String(e?.message ?? error ?? 'unknown').slice(0, 300),
    stack: String(e?.stack ?? '').split('\n').slice(0, 4).join(' | ').slice(0, 600),
    path: typeof location !== 'undefined' ? location.pathname : undefined,
  });
}

let installed = false;
export function installGlobalErrorReporting(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (ev) => reportClientError(ev.error ?? ev.message, 'window.onerror'));
  window.addEventListener('unhandledrejection', (ev) => reportClientError(ev.reason, 'unhandledrejection'));
}
