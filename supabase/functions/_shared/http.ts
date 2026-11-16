// Outbound HTTP with a hard timeout and retry + exponential backoff with jitter.
// Retries only when it is safe: network errors, timeouts, 429 and 5xx. Never on other 4xx.
// POST calls are only retried when the caller passes an Idempotency-Key header.

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;   // per attempt
  retries?: number;     // extra attempts after the first
  baseDelayMs?: number; // first backoff step
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function backoffDelay(attempt: number, baseMs = 300, capMs = 4000): number {
  const exp = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.round(exp / 2 + Math.random() * (exp / 2)); // "equal jitter"
}

export async function fetchWithRetry(url: string, opts: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 10_000, retries = 2, baseDelayMs = 300, ...init } = opts;
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  const safeToRetry = method === "GET" || method === "HEAD" || headers.has("Idempotency-Key");
  const maxAttempts = safeToRetry ? retries + 1 : 1;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // The timer covers connecting + waiting for headers only; it is cleared once the response starts,
      // so long streaming bodies (AI answers) are not cut off.
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      let res: Response;
      try { res = await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === maxAttempts - 1) return res;
      await res.body?.cancel();
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 5000) : backoffDelay(attempt, baseDelayMs));
    } catch (e) {
      lastError = e; // network error or timeout
      if (attempt === maxAttempts - 1) throw e;
      await sleep(backoffDelay(attempt, baseDelayMs));
    }
  }
  throw lastError ?? new Error("request failed");
}
