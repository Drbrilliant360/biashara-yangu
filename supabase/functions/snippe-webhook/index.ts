// Provider -> us. Makes sure a customer who paid but closed the app (or lost signal) is still upgraded.
//
// Security model: the request body is NOT trusted. We only read a payment reference from it, then ask the
// provider directly for the real status (reconcilePayment). An optional shared secret (SNIPPE_WEBHOOK_SECRET)
// is checked in constant time when configured. verify_jwt is off for this function (see supabase/config.toml).
//
// Status codes: 200 = done/ignored (don't retry). 5xx = transient, the provider should retry.
import { adminClient, json, safeEqual } from "../_shared/env.ts";
import { makeLogger } from "../_shared/log.ts";
import { allow } from "../_shared/ratelimit.ts";
import { reconcilePayment, REFERENCE_RE } from "../_shared/payments.ts";

const NO_CORS = {};

Deno.serve(async (req) => {
  const log = makeLogger("snippe-webhook", req);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, NO_CORS);

  try {
    const secret = Deno.env.get("SNIPPE_WEBHOOK_SECRET");
    if (secret) {
      const given = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("token") ?? "";
      if (!safeEqual(given, secret)) { log.warn("bad_secret"); return json({ error: "Unauthorized" }, 401, NO_CORS); }
    }

    const raw = await req.text();
    if (raw.length > 20_000) return json({ error: "Payload too large" }, 413, NO_CORS);
    let payload: any = null;
    try { payload = JSON.parse(raw); } catch { /* ignore */ }
    const reference = payload?.data?.reference ?? payload?.reference ?? payload?.data?.payment_reference;
    if (typeof reference !== "string" || !REFERENCE_RE.test(reference)) return json({ ok: true, ignored: true }, 200, NO_CORS);

    const db = adminClient();
    if (!(await allow(db, `webhook:${reference}`, 30, 600))) return json({ ok: true, throttled: true }, 200, NO_CORS);

    const out = await reconcilePayment(db, reference);
    log.info("processed", { reference, outcome: out.kind, applied: out.kind === "completed" ? out.applied : undefined });
    return json({ ok: true }, 200, NO_CORS);
  } catch (e) {
    log.error("failed", { message: e instanceof Error ? e.message : String(e) });
    return json({ error: "temporary failure" }, 500, NO_CORS); // provider will retry
  }
});
