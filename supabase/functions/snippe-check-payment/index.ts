import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsFor } from "../_shared/cors.ts";

const SUBSCRIPTION_AMOUNT_TZS = 5000;

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req);
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

    const { reference } = await req.json().catch(() => ({}));
    // Reference goes into a URL: allow only safe characters (prevents path injection)
    if (typeof reference !== "string" || !/^[A-Za-z0-9_-]{6,80}$/.test(reference)) {
      return new Response(JSON.stringify({ error: "Missing or invalid reference" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snippeRes = await fetch(`https://api.snippe.sh/v1/payments/${encodeURIComponent(reference)}`, {
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

      const paidAmount = Number(typeof payment.amount === "object" ? payment.amount?.value : payment.amount);
      if (payment?.metadata?.purpose !== "subscription" || !(paidAmount >= SUBSCRIPTION_AMOUNT_TZS)) {
        return new Response(JSON.stringify({ error: "Payment does not match subscription price" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Idempotency: check if we already processed this reference
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id, current_period_end, last_payment_reference")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing && existing.last_payment_reference !== reference) {
        const now = new Date();
        const currentEnd = existing.current_period_end ? new Date(existing.current_period_end) : now;
        const base = currentEnd.getTime() > now.getTime() ? currentEnd : now;
        const newEnd = new Date(base);
        newEnd.setDate(newEnd.getDate() + 30);

        const amountVal = paidAmount;

        // Compare-and-set: only the first request for this reference can apply the renewal,
        // so two simultaneous polls can never extend the subscription twice.
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: newEnd.toISOString(),
            last_payment_date: now.toISOString(),
            last_payment_reference: reference,
            amount: amountVal,
          })
          .eq("user_id", user.id)
          .or(`last_payment_reference.is.null,last_payment_reference.neq.${reference}`);
      } else if (!existing) {
        const now = new Date();
        const newEnd = new Date(now);
        newEnd.setDate(newEnd.getDate() + 30);
        await supabase.from("subscriptions").insert({
          user_id: user.id,
          status: "active",
          current_period_end: newEnd.toISOString(),
          last_payment_date: now.toISOString(),
          last_payment_reference: reference,
          amount: paidAmount,
        });
      }
    }

    return new Response(JSON.stringify({ status, reference }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Could not check the payment. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
