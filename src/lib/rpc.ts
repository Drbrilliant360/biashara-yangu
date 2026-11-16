import { supabase } from '@/integrations/supabase/client';

type RpcResult<T> = PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>;

/**
 * Typed-loosely wrapper for database functions added after the generated
 * Supabase types (create_sale, create_purchase, create_quotation, log_audit_event).
 */
export function callRpc<T = unknown>(fn: string, args: Record<string, unknown>): RpcResult<T> {
  return (supabase as unknown as { rpc: (f: string, a: unknown) => RpcResult<T> }).rpc(fn, args);
}

/** Fire-and-forget audit event (login, client errors). Never throws or blocks the UI. */
export function logAuditEvent(action: 'login' | 'logout' | 'client_error' | 'password_reset_requested', details?: Record<string, unknown>): void {
  try {
    void Promise.resolve(callRpc('log_audit_event', { p_action: action, p_details: details ?? null })).catch(() => undefined);
  } catch {
    /* auditing must never break the app */
  }
}
