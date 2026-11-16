import { corsFor } from "../_shared/cors.ts";
import { adminClient, json } from "../_shared/env.ts";
import { makeLogger } from "../_shared/log.ts";
import { allow, tooMany } from "../_shared/ratelimit.ts";
import { reconcilePayment, REFERENCE_RE } from "../_shared/payments.ts";

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const log = makeLogger("snippe-check-payment", req);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
    if (!token) return json({ error: "Unauthorized" }, 401, cors);
    const db = adminClient();
    const { data: userData, error: userErr } = await db.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401, cors);
    const user = userData.user;

    // The app polls every 4s for up to 3 minutes (~45 calls); allow comfortable headroom.
    if (!(await allow(db, `pay-check:${user.id}`, 120, 600))) return tooMany(cors, 60);

    const { reference } = await req.json().catch(() => ({}));
    if (typeof reference !== "string" || !REFERENCE_RE.test(reference)) return json({ error: "Missing or invalid reference" }, 400, cors);

    // Ownership comes from OUR ledger, not from provider metadata or the request.
    const { data: row } = await db.from("payments").select("user_id").eq("reference", reference).maybeSingle();
    if (!row || row.user_id !== user.id) return json({ error: "Payment not found" }, 404, cors);

    const out = await reconcilePayment(db, reference);
    if (out.kind === "unknown_reference") return json({ error: "Payment not found" }, 404, cors);
    const status = out.kind === "completed" ? "completed" : out.status;
    log.info("checked", { reference, status, applied: out.kind === "completed" ? out.applied : undefined });
    return json({ status, reference }, 200, cors);
  } catch (e) {
    log.error("unhandled", { message: e instanceof Error ? e.message : String(e) });
    return json({ error: "Could not check the payment. Please try again." }, 500, cors);
  }
});
