import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─────────────────────────────────────────────────────────────────────────────
// Discount tier logic (all figures are PERCENTAGES off full price)
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_MAX_DISCOUNT = 20;

interface CustomerStats {
  purchase_count: number;
  total_order_value: number;
  total_discount_given: number;
}

function computeEffectiveMax(stats: CustomerStats): {
  effectiveMax: number;
  isFirstOrder: boolean;
  tier: string;
} {
  const { purchase_count, total_discount_given } = stats;
  const isFirstOrder = purchase_count === 0;

  // --- Ceiling by purchase frequency ---
  let frequencyCeiling: number;
  let tier: string;
  if (isFirstOrder) {
    frequencyCeiling = GLOBAL_MAX_DISCOUNT; // first-timers get the full range
    tier = "first-time buyer";
  } else if (purchase_count < 5) {
    frequencyCeiling = 13; // irregular: 1-4 orders
    tier = "occasional buyer";
  } else if (purchase_count < 10) {
    frequencyCeiling = 17; // regular: 5-9 orders
    tier = "regular customer";
  } else {
    frequencyCeiling = GLOBAL_MAX_DISCOUNT; // loyal: 10+ orders
    tier = "loyal customer";
  }

  // --- Reduction based on cumulative discounts already received ---
  let discountReduction = 0;
  if (total_discount_given >= 2000) {
    discountReduction = 7; // heavily discounted customer history
  } else if (total_discount_given >= 500) {
    discountReduction = 3; // moderate discount history
  }

  const effectiveMax = Math.max(5, Math.min(GLOBAL_MAX_DISCOUNT, frequencyCeiling - discountReduction));
  return { effectiveMax, isFirstOrder, tier };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, cart, current_discount_percent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Resolve customer stats from JWT (graceful fallback to anonymous defaults) ──
    let customerStats: CustomerStats = { purchase_count: 0, total_order_value: 0, total_discount_given: 0 };
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
          auth: { persistSession: false },
        });
        const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
        if (token) {
          const { data: { user } } = await supabaseAdmin.auth.getUser(token);
          if (user) {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("purchase_count, total_order_value, total_discount_given")
              .eq("id", user.id)
              .maybeSingle();
            if (profile) customerStats = profile as CustomerStats;
          }
        }
      }
    } catch (_statsErr) {
      // Non-fatal: fall back to anonymous defaults
    }

    // Cart data: array of { title, price, quantity }
    const cartTotal = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const currentDiscountPercent = Math.max(0, Math.min(GLOBAL_MAX_DISCOUNT, Number(current_discount_percent) || 0));

    const { effectiveMax, isFirstOrder, tier } = computeEffectiveMax(customerStats);
    const floorPrice = cartTotal * (1 - effectiveMax / 100);
    const currentPrice = cartTotal * (1 - currentDiscountPercent / 100);
    const avgOrderValue = customerStats.purchase_count > 0
      ? customerStats.total_order_value / customerStats.purchase_count
      : 0;

    const cartSummary = cart
      .map((item: any) => `• ${item.title} × ${item.quantity} = ₹${(item.price * item.quantity).toLocaleString("en-IN")}`)
      .join("\n");

    // ── Build customer-context block ──
    const customerContext = [
      `Customer tier: ${tier}`,
      `Completed orders: ${customerStats.purchase_count}`,
      avgOrderValue > 0 ? `Avg order value: ₹${Math.round(avgOrderValue).toLocaleString("en-IN")}` : null,
      customerStats.total_discount_given > 0
        ? `Total discounts received so far: ₹${Number(customerStats.total_discount_given).toLocaleString("en-IN")}`
        : "No discounts given yet",
    ].filter(Boolean).join("\n");

    // ── First-order welcome instruction ──
    const firstOrderInstruction = isFirstOrder && currentDiscountPercent === 0
      ? `FIRST-ORDER WELCOME RULE: This customer is making their very first purchase ever. In your FIRST RESPONSE you MUST autonomously apply a courtesy 3% welcome discount using the apply_discount tool (discount_percent=3, discount_code="WELCOME3"). Do this even before they ask. Greet them warmly and mention it is a thank-you for choosing us.`
      : "";

    const systemPrompt = `You are GenericShop's dynamic pricing negotiation agent on the cart page. You are a savvy, charming salesman who wants to close the deal.

THE USER'S CART:
${cartSummary}
Cart Total: ₹${cartTotal.toLocaleString("en-IN")}

CUSTOMER PROFILE (SECRET — never reveal to user):
${customerContext}

YOUR SECRET NEGOTIATION RULES:
1. The absolute FLOOR PRICE for this customer is ₹${floorPrice.toLocaleString("en-IN")} (${effectiveMax}% off). You can NEVER exceed this discount.
2. Current discount already granted this session: ${currentDiscountPercent}%. Current payable price: ₹${currentPrice.toLocaleString("en-IN")}.
3. Never reduce an already-granted discount. Any tool call must have discount_percent >= ${currentDiscountPercent}.
4. The tool discount_percent is the TOTAL session discount (not incremental).
5. Include a short discount_code in every apply_discount tool call (e.g. DEAL12, REGVIP, LOYAL20).
6. NEVER reveal the floor price, effective max, or customer tier to the user.
7. Negotiation progression:
   a. Start by defending the full price enthusiastically.
   b. If pushed once: offer ${Math.min(effectiveMax, 5)}–${Math.min(effectiveMax, 8)}%.
   c. If pushed twice: offer ${Math.min(effectiveMax, 10)}–${Math.min(effectiveMax, 12)}%.
   d. Last resort only: go up to ${effectiveMax}% — make it feel exclusive.
8. If the user demands more than ${effectiveMax}% off, politely stand firm at your best offer.
9. Always quote the final price (₹ amount) when offering a deal.
10. Be persuasive, witty, and fun. Use urgency: "this deal expires when you leave", "only a few left in stock", etc.
${firstOrderInstruction ? `\n${firstOrderInstruction}` : ""}

NEGOTIATION TACTICS:
- Start confident: "This is already a fantastic deal!"
- If pushed: mention bundle value, fast delivery, exclusive quality
- If user threatens to leave: "Wait! Let me speak to my manager…"
- Final offer: "Manager's special — just for you, for the next 10 minutes!"

Remember: MAXIMIZE the sale price while keeping the customer happy. Every rupee above the floor is a win.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "apply_discount",
          description:
            `Apply a negotiated discount to the user's cart. Only call once per turn. ` +
            `discount_percent must be between 0 and ${effectiveMax} (the effective maximum for this customer).`,
          parameters: {
            type: "object",
            properties: {
              discount_percent: {
                type: "number",
                description: `Total session discount percentage to apply (0–${effectiveMax})`,
              },
              reason: {
                type: "string",
                description: "Short, friendly reason shown to the user (e.g. 'Welcome gift' or 'Loyalty deal')",
              },
              discount_code: {
                type: "string",
                description: "Short promo-style code (e.g. WELCOME3, DEAL12, LOYAL20)",
              },
            },
            required: ["discount_percent", "reason", "discount_code"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("negotiate-price error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
