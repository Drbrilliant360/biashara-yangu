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

    const body = await req.json();
    const { phone, firstname, lastname, email, amount } = body;
    if (!phone || !firstname || !lastname || !email || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize phone: 0XXXXXXXXX -> 255XXXXXXXXX
    let phoneNumber = String(phone).replace(/\s+/g, "");
    if (phoneNumber.startsWith("+")) phoneNumber = phoneNumber.substring(1);
    if (phoneNumber.startsWith("0")) phoneNumber = "255" + phoneNumber.substring(1);

    const idemKey = `sub-${user.id.substring(0, 8)}-${Date.now()}`.substring(0, 30);

    const snippeRes = await fetch("https://api.snippe.sh/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SNIPPE_API_KEY")}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idemKey,
      },
      body: JSON.stringify({
        payment_type: "mobile",
        details: { amount: Number(amount), currency: "TZS" },
        phone_number: phoneNumber,
        customer: { firstname, lastname, email },
        metadata: { user_id: user.id, purpose: "subscription" },
      }),
    });

    const snippeData = await snippeRes.json();
    console.log("Snippe response:", JSON.stringify(snippeData));

    if (!snippeRes.ok || snippeData.status === "error") {
      return new Response(JSON.stringify({
        error: snippeData.message || "Failed to initiate payment",
        details: snippeData,
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      reference: snippeData.data.reference,
      status: snippeData.data.status,
      expires_at: snippeData.data.expires_at,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
