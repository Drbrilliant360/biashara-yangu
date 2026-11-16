import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Fail with a clear, secret-free message when a required secret is missing.
export function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required secret: ${name}`);
  return v;
}

// Module-scope client: created once per isolate and reused by warm invocations
// (saves work on every request and keeps cold starts short).
let admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  if (!admin) {
    admin = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

// Constant-time string comparison (for shared secrets).
export function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}
