/**
 * Tracks in-flight backend requests so the UI can show a global progress bar
 * and an "offline" banner, without touching every page.
 * Installed once from main.tsx by wrapping window.fetch for backend URLs only.
 */
type Listener = (inFlight: number) => void;

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
    return original(input, init).then(
      (res) => { finish(); return res; },
      (err) => { finish(); throw err; },
    );
  };
}
