import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsFor } from "../_shared/cors.ts";

// Price is decided on the server. Never trust an amount sent by the client.
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

    const bad = (message: string) =>
      new Response(JSON.stringify({ error: message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return bad("Invalid request");
    const { phone, firstname, lastname, email } = body as Record<string, unknown>;
    if (!phone || !firstname || !lastname || !email) return bad("Missing required fields");

    // Server-side validation (never trust the browser)
    const nameOk = (v: unknown) => typeof v === "string" && v.trim().length >= 1 && v.length <= 60 && ![...v].some((c) => c.charCodeAt(0) < 32) && !/[<>]/.test(v);
    if (!nameOk(firstname) || !nameOk(lastname)) return bad("Enter a valid first and last name");
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return bad("Enter a valid email address");
    }

    // Normalize phone: 0XXXXXXXXX -> 255XXXXXXXXX
    let phoneNumber = String(phone).replace(/[\s-]+/g, "");
    if (phoneNumber.startsWith("+")) phoneNumber = phoneNumber.substring(1);
    if (phoneNumber.startsWith("0")) phoneNumber = "255" + phoneNumber.substring(1);
    if (!/^255[67][0-9]{8}$/.test(phoneNumber)) return bad("Enter a valid Tanzanian mobile money number");

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
        details: { amount: SUBSCRIPTION_AMOUNT_TZS, currency: "TZS" },
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
    return new Response(JSON.stringify({ error: "Could not start the payment. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
