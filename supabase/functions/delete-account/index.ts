// Permanently deletes the calling user's account and the data they own.
// Required by Apple App Store Guideline 5.1.1(v) (in-app account deletion).
//
// Deploy:  supabase functions deploy delete-account
// The function uses the service-role key (provided automatically by Supabase).
import { corsFor } from "../_shared/cors.ts";
import { adminClient } from "../_shared/env.ts";
import { makeLogger } from "../_shared/log.ts";
import { allow, tooMany } from "../_shared/ratelimit.ts";

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const log = makeLogger("delete-account", req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const admin = adminClient();

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    if (!(await allow(admin, `delete-account:${userId}`, 3, 3600))) return tooMany(corsHeaders, 3600);

    // Confirmation must be explicit so a stray request can never delete an account.
    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== "DELETE") return json({ error: "Confirmation required" }, 400);

    // Audit trail first (ids only, no personal data), so a record exists even if a later step fails.
    await admin.from("audit_log").insert({
      actor_id: userId,
      action: "account_deleted",
      table_name: "auth.users",
      record_id: userId,
    });

    // Remove shops owned by this user (child rows cascade), staff memberships and subscription.
    const { error: shopsErr } = await admin.from("shops").delete().eq("owner_id", userId);
    if (shopsErr) throw shopsErr;
    await admin.from("shop_users").delete().eq("user_id", userId);
    await admin.from("subscriptions").delete().eq("user_id", userId);

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    log.info("account_deleted", { user: userId });
    return json({ success: true });
  } catch (e) {
    log.error("failed", { message: e instanceof Error ? e.message : String(e) });
    return json({ error: "Could not delete account. Please contact support." }, 500);
  }
});
