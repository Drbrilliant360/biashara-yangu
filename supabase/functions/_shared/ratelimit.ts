import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// DB-backed fixed-window limiter (public.check_rate_limit). Works across isolates, unlike in-memory counters.
// Fails OPEN if the limiter itself errors, so an outage of the limiter never blocks paying customers.
export async function allow(db: SupabaseClient, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await db.rpc("check_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  if (error) { console.warn(JSON.stringify({ level: "warn", event: "rate_limit_unavailable", message: error.message })); return true; }
  return data === true;
}

export const tooMany = (headers: Record<string, string>, retryAfterSeconds = 60) =>
  new Response(JSON.stringify({ error: "Too many requests. Please wait a minute and try again." }), {
    status: 429, headers: { ...headers, "Content-Type": "application/json", "Retry-After": String(retryAfterSeconds) },
  });
