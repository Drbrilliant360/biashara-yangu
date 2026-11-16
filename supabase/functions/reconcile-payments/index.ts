// Background job (run every 5 minutes, see docs/OPERATIONS.md). Acts as the retry queue for payments:
// any payment that is still pending (or paid but not applied) is re-checked with the provider.
// Protected by the CRON_SECRET bearer token; verify_jwt is off for this function.
import { adminClient, json, safeEqual, requireEnv } from "../_shared/env.ts";
import { makeLogger, alert } from "../_shared/log.ts";
import { reconcilePayment } from "../_shared/payments.ts";

const BATCH = 25;
const GIVE_UP_AFTER_HOURS = 24;

Deno.serve(async (req) => {
  const log = makeLogger("reconcile-payments", req);
  try {
    const given = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
    if (!safeEqual(given, requireEnv("CRON_SECRET"))) return json({ error: "Unauthorized" }, 401, {});

    const db = adminClient();
    const since = new Date(Date.now() - GIVE_UP_AFTER_HOURS * 3600_000).toISOString();
    // Skip the last minute: the customer's own app is still polling those.
    const settled = new Date(Date.now() - 60_000).toISOString();
    const { data: rows, error } = await db.from("payments")
      .select("reference,status,applied_at,created_at,attempts")
      .or("status.eq.pending,and(status.eq.completed,applied_at.is.null)")
      .gte("created_at", since).lte("created_at", settled)
      .order("created_at", { ascending: true }).limit(BATCH);
    if (error) throw error;

    let applied = 0, failed = 0;
    for (const r of rows ?? []) {
      try {
        const out = await reconcilePayment(db, r.reference);
        if (out.kind === "completed" && out.applied) applied++;
      } catch (e) {
        failed++;
        log.warn("reconcile_item_failed", { reference: r.reference, message: e instanceof Error ? e.message : String(e) });
      }
    }

    // Pending longer than the provider's expiry: mark expired so it stops being retried.
    await db.from("payments").update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("status", "pending").lt("created_at", since);

    if (failed > 0 && failed === (rows?.length ?? 0)) await alert("Payment reconcile job: every item failed", { failed });
    log.info("done", { checked: rows?.length ?? 0, applied, failed });
    return json({ checked: rows?.length ?? 0, applied, failed }, 200, {});
  } catch (e) {
    log.error("failed", { message: e instanceof Error ? e.message : String(e) });
    return json({ error: "failed" }, 500, {});
  }
});
