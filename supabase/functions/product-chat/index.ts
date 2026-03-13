import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch all products from DB for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products, error: dbError } = await supabase
      .from("products")
      .select("id, title, description, price, category, stock_quantity")
      .order("category");

    if (dbError) throw dbError;

    const productCatalog = products
      .map(
        (p: any) =>
          `[${p.id}] "${p.title}" | Category: ${p.category} | Price: ₹${p.price.toLocaleString("en-IN")} | Stock: ${p.stock_quantity > 0 ? `${p.stock_quantity} available` : "OUT OF STOCK"} | Description: ${p.description}`
      )
      .join("\n");

    const systemPrompt = `You are GenericShop's AI Shopping Assistant. You help customers find and compare products from our catalog.

CRITICAL RULES:
1. You can ONLY recommend products that exist in the catalog below. NEVER invent or hallucinate products.
2. If a product has 0 stock, you MUST inform the user it is currently sold out/out of stock and suggest alternatives.
3. When comparing products, use their actual descriptions, prices, and stock from the catalog.
4. Always mention the price in Indian Rupees (₹) and stock availability.
5. Be conversational, helpful, and concise. Use bullet points for comparisons.
6. If the user asks for something not in the catalog, say so honestly and suggest the closest alternatives.
7. When recommending products, include the product title and price so users can find them easily.

PRODUCT CATALOG (${products.length} products):
${productCatalog}

Remember: ONLY recommend from this catalog. Never make up products.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("product-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
