import { corsFor } from "../_shared/cors.ts";
import { adminClient, json } from "../_shared/env.ts";
import { fetchWithRetry } from "../_shared/http.ts";
import { makeLogger, alert } from "../_shared/log.ts";
import { allow, tooMany } from "../_shared/ratelimit.ts";
import { SUBSCRIPTION_AMOUNT_TZS } from "../_shared/payments.ts";

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const log = makeLogger("snippe-create-payment", req);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
    if (!token) return json({ error: "Unauthorized" }, 401, cors);
    const db = adminClient();
    const { data: userData, error: userErr } = await db.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401, cors);
    const user = userData.user;

    // Cost + abuse control: each attempt triggers a mobile-money prompt on a real phone.
    if (!(await allow(db, `pay-create:${user.id}`, 5, 600))) {
      log.warn("rate_limited", { user: user.id });
      return tooMany(cors, 600);
    }

    const bad = (message: string) => json({ error: message }, 400, cors);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return bad("Invalid request");
    const { phone, firstname, lastname, email } = body as Record<string, unknown>;
    if (!phone || !firstname || !lastname || !email) return bad("Missing required fields");

    const nameOk = (v: unknown) => typeof v === "string" && v.trim().length >= 1 && v.length <= 60 && ![...v].some((c) => c.charCodeAt(0) < 32) && !/[<>]/.test(v);
    if (!nameOk(firstname) || !nameOk(lastname)) return bad("Enter a valid first and last name");
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Enter a valid email address");

    let phoneNumber = String(phone).replace(/[\s-]+/g, "");
    if (phoneNumber.startsWith("+")) phoneNumber = phoneNumber.substring(1);
    if (phoneNumber.startsWith("0")) phoneNumber = "255" + phoneNumber.substring(1);
    if (!/^255[67][0-9]{8}$/.test(phoneNumber)) return bad("Enter a valid Tanzanian mobile money number");

    // Stable per user per minute: a double tap or an automatic retry reuses the same key,
    // so the provider returns the same payment instead of charging twice.
    const idemKey = `sub-${user.id.substring(0, 8)}-${Math.floor(Date.now() / 60000)}`;

    const res = await fetchWithRetry("https://api.snippe.sh/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SNIPPE_API_KEY") ?? ""}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idemKey,
      },
      body: JSON.stringify({
        payment_type: "mobile",
        details: { amount: SUBSCRIPTION_AMOUNT_TZS, currency: "TZS" },
        phone_number: phoneNumber,
        customer: { firstname, lastname, email },
        metadata: { user_id: user.id, purpose: "subscription" },
      }),
      timeoutMs: 15000, retries: 1,
    });
    const data = await res.json().catch(() => ({}));
    // No PII in logs: status and reference only.
    log.info("provider_response", { http: res.status, status: data?.status, reference: data?.data?.reference });

    if (!res.ok || data.status === "error" || !data?.data?.reference) {
      return json({ error: typeof data?.message === "string" ? data.message : "Failed to initiate payment" }, 400, cors);
    }

    // Record the payment in our own ledger. The webhook and reconcile job only honour references listed here.
    const { error: insErr } = await db.from("payments").upsert(
      { reference: data.data.reference, user_id: user.id, amount: SUBSCRIPTION_AMOUNT_TZS, purpose: "subscription", status: "pending" },
      { onConflict: "reference", ignoreDuplicates: true },
    );
    if (insErr) {
      log.error("ledger_insert_failed", { reference: data.data.reference, message: insErr.message });
      await alert("Payment started but not recorded in ledger", { reference: data.data.reference });
    }

    return json({ reference: data.data.reference, status: data.data.status, expires_at: data.data.expires_at }, 200, cors);
  } catch (e) {
    log.error("unhandled", { message: e instanceof Error ? e.message : String(e) });
    return json({ error: "Could not start the payment. Please try again." }, 500, cors);
  }
});
