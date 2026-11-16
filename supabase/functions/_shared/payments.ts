import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fetchWithRetry } from "./http.ts";
import { alert } from "./log.ts";
import { requireEnv } from "./env.ts";

export const SUBSCRIPTION_AMOUNT_TZS = 5000;
export const REFERENCE_RE = /^[A-Za-z0-9_-]{6,80}$/;

export type Outcome =
  | { kind: "unknown_reference" }
  | { kind: "pending" | "failed" | "voided" | "expired"; status: string }
  | { kind: "completed"; applied: boolean; userId: string };

// Single source of truth for "is this payment really paid, and has it been applied?".
// Used by the browser poll, the provider webhook and the reconcile job.
// The provider is always asked directly: nothing in an incoming request is trusted as proof of payment.
export async function reconcilePayment(db: SupabaseClient, reference: string): Promise<Outcome> {
  if (!REFERENCE_RE.test(reference)) return { kind: "unknown_reference" };

  const { data: row } = await db.from("payments").select("reference,user_id,amount,status,applied_at,attempts").eq("reference", reference).maybeSingle();
  if (!row) return { kind: "unknown_reference" };            // only payments WE created are honoured
  if (row.applied_at) return { kind: "completed", applied: false, userId: row.user_id };

  const res = await fetchWithRetry(`https://api.snippe.sh/v1/payments/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${requireEnv("SNIPPE_API_KEY")}` },
    timeoutMs: 8000, retries: 2,
  });
  if (!res.ok) throw new Error(`provider_status_${res.status}`);
  const body = await res.json();
  const p = body?.data;
  const status = String(p?.status ?? "pending");

  await db.from("payments").update({
    provider_status: status, last_checked_at: new Date().toISOString(), attempts: (row.attempts ?? 0) + 1,
  }).eq("reference", reference);

  if (status !== "completed") {
    const terminal = ["failed", "voided", "expired"].includes(status);
    if (terminal) await db.from("payments").update({ status, updated_at: new Date().toISOString() }).eq("reference", reference).eq("status", "pending");
    return { kind: terminal ? (status as "failed" | "voided" | "expired") : "pending", status };
  }

  const paid = Number(typeof p.amount === "object" ? p.amount?.value : p.amount);
  if (p?.metadata?.user_id !== row.user_id || p?.metadata?.purpose !== "subscription" || !(paid >= SUBSCRIPTION_AMOUNT_TZS)) {
    await alert("Payment completed but did not match our records", { reference, expectedUser: row.user_id, paid });
    throw new Error("payment_mismatch");
  }

  const { data: applied, error } = await db.rpc("apply_subscription_payment", {
    p_reference: reference, p_user_id: row.user_id, p_amount: paid,
  });
  if (error) {
    await alert("Customer paid but subscription was NOT extended", { reference, error: error.message });
    throw new Error("apply_failed");
  }
  return { kind: "completed", applied: applied === true, userId: row.user_id };
}
