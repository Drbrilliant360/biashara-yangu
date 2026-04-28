import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, shopId } = await req.json();
    if (!shopId) throw new Error("shopId required");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build shop context (RLS ensures only accessible shops)
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const [shopRes, productsRes, salesRes, saleItemsRes, expensesRes, purchasesRes] = await Promise.all([
      supabase.from("shops").select("name,currency,location").eq("id", shopId).maybeSingle(),
      supabase.from("products").select("name,category,stock_quantity,min_stock_level,buying_price,selling_price,is_active").eq("shop_id", shopId).eq("is_active", true),
      supabase.from("sales").select("total,payment_method,created_at").eq("shop_id", shopId).gte("created_at", monthStart),
      supabase.from("sale_items").select("product_name,quantity,unit_price,total,created_at,sales!inner(shop_id,created_at)").eq("sales.shop_id", shopId).gte("created_at", monthStart),
      supabase.from("expenses").select("category,amount,expense_date").eq("shop_id", shopId).gte("expense_date", monthStart.slice(0, 10)),
      supabase.from("purchases").select("supplier_name,total_amount,purchase_date").eq("shop_id", shopId).gte("purchase_date", monthStart.slice(0, 10)),
    ]);

    const products = productsRes.data ?? [];
    const sales = salesRes.data ?? [];
    const saleItems = saleItemsRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const purchases = purchasesRes.data ?? [];
    const shop = shopRes.data;

    // Aggregate top sellers
    const productSales: Record<string, { qty: number; revenue: number }> = {};
    for (const it of saleItems) {
      const key = it.product_name;
      if (!productSales[key]) productSales[key] = { qty: 0, revenue: 0 };
      productSales[key].qty += Number(it.quantity);
      productSales[key].revenue += Number(it.total);
    }
    const topSellers = Object.entries(productSales)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 10)
      .map(([name, v]) => ({ name, quantity_sold: v.qty, revenue: v.revenue }));

    const todaySales = sales.filter((s) => s.created_at >= todayStart);
    const totalRevenueMonth = sales.reduce((s, x) => s + Number(x.total), 0);
    const totalRevenueToday = todaySales.reduce((s, x) => s + Number(x.total), 0);
    const totalExpensesMonth = expenses.reduce((s, x) => s + Number(x.amount), 0);
    const totalPurchasesMonth = purchases.reduce((s, x) => s + Number(x.total_amount), 0);
    const lowStock = products.filter((p) => p.stock_quantity <= (p.min_stock_level ?? 5));
    const outOfStock = products.filter((p) => p.stock_quantity === 0);
    const inventoryValue = products.reduce((s, p) => s + Number(p.stock_quantity) * Number(p.buying_price ?? 0), 0);

    const context = {
      shop: shop ? { name: shop.name, currency: shop.currency, location: shop.location } : null,
      date: today.toISOString().slice(0, 10),
      summary_this_month: {
        total_revenue: totalRevenueMonth,
        total_expenses: totalExpensesMonth,
        total_purchases: totalPurchasesMonth,
        transactions: sales.length,
      },
      today: {
        total_revenue: totalRevenueToday,
        transactions: todaySales.length,
      },
      inventory: {
        total_products: products.length,
        total_stock_units: products.reduce((s, p) => s + Number(p.stock_quantity), 0),
        inventory_value_at_cost: inventoryValue,
        out_of_stock_count: outOfStock.length,
        low_stock_count: lowStock.length,
        low_stock_items: lowStock.slice(0, 20).map((p) => ({ name: p.name, stock: p.stock_quantity, min: p.min_stock_level })),
      },
      products: products.slice(0, 100).map((p) => ({
        name: p.name,
        category: p.category,
        stock: p.stock_quantity,
        buying_price: p.buying_price,
        selling_price: p.selling_price,
      })),
      top_selling_products_this_month: topSellers,
      recent_expenses: expenses.slice(0, 20),
      recent_purchases: purchases.slice(0, 20),
    };

    const systemPrompt = `You are Mauzo AI, a helpful business analyst assistant for a small shop owner using the Biashara Yangu POS app. You answer questions about their shop using the JSON data provided below.

Rules:
- Answer ONLY based on the provided data. If the data doesn't contain the answer, say so clearly.
- Be concise, friendly, and use simple language. You can answer in English or Swahili depending on the user's language.
- Format numbers with the shop's currency (${shop?.currency ?? "KES"}).
- Use markdown (lists, bold) when helpful.
- For "best selling" questions, use top_selling_products_this_month.
- For "stock remaining" questions, use inventory and products data.
- For profit questions: profit ≈ revenue - cost_of_goods - expenses - purchases (mention assumptions).

SHOP DATA (this month):
${JSON.stringify(context)}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiRes.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mauzo-ai error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
