// Permanently deletes the calling user's account and the data they own.
// Required by Apple App Store Guideline 5.1.1(v) (in-app account deletion).
//
// Deploy:  supabase functions deploy delete-account
// The function uses the service-role key (provided automatically by Supabase).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    // Confirmation must be explicit so a stray request can never delete an account.
    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== "DELETE") return json({ error: "Confirmation required" }, 400);

    // Remove shops owned by this user (child rows cascade), staff memberships and subscription.
    const { error: shopsErr } = await admin.from("shops").delete().eq("owner_id", userId);
    if (shopsErr) throw shopsErr;
    await admin.from("shop_users").delete().eq("user_id", userId);
    await admin.from("subscriptions").delete().eq("user_id", userId);

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return json({ success: true });
  } catch (e) {
    console.error("delete-account error:", e);
    return json({ error: "Could not delete account. Please contact support." }, 500);
  }
});
