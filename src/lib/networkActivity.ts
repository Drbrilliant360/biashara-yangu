/**
 * Tracks in-flight backend requests so the UI can show a global progress bar
 * and an "offline" banner, without touching every page.
 * Installed once from main.tsx by wrapping window.fetch for backend URLs only.
 */
type Listener = (inFlight: number) => void;

export const REQUEST_TIMEOUT_MS = 30_000;

let inFlight = 0;
const listeners = new Set<Listener>();
let installed = false;

const emit = () => listeners.forEach((l) => l(inFlight));

export const subscribeNetworkActivity = (l: Listener): (() => void) => {
  listeners.add(l);
  l(inFlight);
  return () => { listeners.delete(l); };
};

export function installNetworkActivity(): void {
  if (installed || typeof window === 'undefined' || !window.fetch) return;
  installed = true;
  const backend = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
  const original = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!backend || !url.startsWith(backend)) return original(input, init);
    inFlight += 1;
    emit();
    const finish = () => { inFlight = Math.max(0, inFlight - 1); emit(); };

    // Timeout: a hung connection must not leave the UI spinning forever.
    // Covers connecting + waiting for headers only (cleared when the response starts), so streaming
    // answers such as Mauzo AI are not cut off. The caller's own AbortSignal still works.
    const ctrl = new AbortController();
    const callerSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    if (callerSignal) {
      if (callerSignal.aborted) ctrl.abort(); else callerSignal.addEventListener('abort', () => ctrl.abort(), { once: true });
    }
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    return original(input, { ...init, signal: ctrl.signal }).then(
      (res) => { clearTimeout(timer); finish(); return res; },
      (err) => {
        clearTimeout(timer); finish();
        if (ctrl.signal.aborted && !callerSignal?.aborted) throw new Error('Request timed out. Failed to fetch');
        throw err;
      },
    );
  };
}
