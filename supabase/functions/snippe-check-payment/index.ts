import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "Missing reference" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snippeRes = await fetch(`https://api.snippe.sh/v1/payments/${reference}`, {
      headers: { "Authorization": `Bearer ${Deno.env.get("SNIPPE_API_KEY")}` },
    });
    const snippeData = await snippeRes.json();
    console.log("Snippe status:", JSON.stringify(snippeData));

    if (!snippeRes.ok) {
      return new Response(JSON.stringify({ error: snippeData.message || "Failed to fetch" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = snippeData.data;
    const status = payment.status;

    // If payment completed, verify metadata belongs to this user, then extend subscription
    if (status === "completed") {
      const metaUserId = payment?.metadata?.user_id;
      if (metaUserId !== user.id) {
        return new Response(JSON.stringify({ error: "Payment does not belong to user" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Idempotency: check if we already processed this reference
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id, current_period_end, last_payment_reference")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing && (existing as any).last_payment_reference !== reference) {
        const now = new Date();
        const currentEnd = existing.current_period_end ? new Date(existing.current_period_end) : now;
        const base = currentEnd.getTime() > now.getTime() ? currentEnd : now;
        const newEnd = new Date(base);
        newEnd.setDate(newEnd.getDate() + 30);

        const amountVal = typeof payment.amount === "object" ? payment.amount.value : payment.amount;

        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: newEnd.toISOString(),
            last_payment_date: now.toISOString(),
            last_payment_reference: reference,
            amount: amountVal,
          })
          .eq("user_id", user.id);
      }
    }

    return new Response(JSON.stringify({ status, reference }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
