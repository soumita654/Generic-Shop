import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductRecord {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock_quantity: number;
  created_at?: string;
}

interface VisionStorefrontResponse {
  storefront_title: string;
  storefront_subtitle: string;
  vibe_tags: string[];
  palette: string[];
  materials: string[];
  thematic_elements: string[];
  rationale: string;
  matched_product_ids: string[];
}

function normalizeList(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function keywordTokens(payload: Partial<VisionStorefrontResponse>): string[] {
  const source = [
    ...(payload.vibe_tags ?? []),
    ...(payload.palette ?? []),
    ...(payload.materials ?? []),
    ...(payload.thematic_elements ?? []),
    payload.storefront_title ?? "",
    payload.storefront_subtitle ?? "",
    payload.rationale ?? "",
  ].join(" ");

  return Array.from(
    new Set(
      source
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3)
    )
  );
}

function scoreProduct(product: ProductRecord, keywords: string[]): number {
  const haystack = `${product.title} ${product.description} ${product.category}`.toLowerCase();
  return keywords.reduce((score, token) => {
    if (!haystack.includes(token)) return score;
    if (product.title.toLowerCase().includes(token)) return score + 5;
    if (product.category.toLowerCase().includes(token)) return score + 4;
    return score + 2;
  }, 0);
}

function resolveMatchedProducts(parsed: Partial<VisionStorefrontResponse>, products: ProductRecord[]): ProductRecord[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  const selected: ProductRecord[] = [];
  const seen = new Set<string>();

  for (const id of normalizeList(parsed.matched_product_ids, 12)) {
    const product = byId.get(id);
    if (!product || seen.has(product.id)) continue;
    selected.push(product);
    seen.add(product.id);
  }

  const keywords = keywordTokens(parsed);
  const fallback = [...products]
    .map((product) => ({ product, score: scoreProduct(product, keywords) }))
    .filter(({ product }) => !seen.has(product.id))
    .sort((left, right) => right.score - left.score || right.product.stock_quantity - left.product.stock_quantity)
    .map(({ product }) => product);

  for (const product of fallback) {
    if (selected.length >= 12) break;
    if (selected.length >= 6 && keywords.length > 0 && scoreProduct(product, keywords) <= 0) break;
    selected.push(product);
    seen.add(product.id);
  }

  if (selected.length === 0) {
    return products.slice(0, 8);
  }

  return selected.slice(0, 12);
}

function extractJson(content: unknown): Partial<VisionStorefrontResponse> {
  if (typeof content === "string") {
    return JSON.parse(content) as Partial<VisionStorefrontResponse>;
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part === "object" && part && "text" in part ? String((part as { text?: unknown }).text ?? "") : ""))
      .join("")
      .trim();
    return JSON.parse(text) as Partial<VisionStorefrontResponse>;
  }

  throw new Error("Vision model returned an unexpected payload");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_data_url } = await req.json();
    if (typeof image_data_url !== "string" || !image_data_url.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "A valid image upload is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products, error: dbError } = await supabase
      .from("products")
      .select("id, title, description, price, category, image_url, stock_quantity, created_at")
      .order("created_at", { ascending: false });

    if (dbError) throw dbError;

    const catalog = (products as ProductRecord[]).map(
      (product) =>
        `[${product.id}] ${product.title} | Category: ${product.category} | Price: ₹${Number(product.price).toLocaleString("en-IN")} | Description: ${product.description}`
    ).join("\n");

    const systemPrompt = `You are GenericShop's visual merchandiser. Analyze the uploaded image and convert the aesthetic into a curated storefront using ONLY products from the catalog.

Return strict JSON with these exact keys:
- storefront_title: string
- storefront_subtitle: string
- vibe_tags: string[]
- palette: string[]
- materials: string[]
- thematic_elements: string[]
- rationale: string
- matched_product_ids: string[]

Rules:
1. Identify the image's core vibe, mood, dominant colours, materials, textures, and thematic elements.
2. Select 6-12 product IDs from the catalog that best match the image's aesthetic.
3. Never invent a product ID. Only use IDs from the catalog below.
4. Bias toward aesthetic relevance over category matching.
5. The storefront title/subtitle should feel like a merchandised landing page, not a technical report.
6. Keep rationale under 60 words.

PRODUCT CATALOG:
${catalog}`;

    const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image and build a storefront from the catalog." },
              { type: "image_url", image_url: { url: image_data_url } },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      const text = await visionResponse.text();
      console.error("visual-storefront AI error:", visionResponse.status, text);
      return new Response(JSON.stringify({ error: "Vision service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await visionResponse.json();
    const content = payload.choices?.[0]?.message?.content;
    const parsed = extractJson(content);
    const matchedProducts = resolveMatchedProducts(parsed, products as ProductRecord[]);

    const responseBody = {
      storefrontTitle: typeof parsed.storefront_title === "string" && parsed.storefront_title.trim()
        ? parsed.storefront_title.trim()
        : "Curated From Your Image",
      storefrontSubtitle: typeof parsed.storefront_subtitle === "string" && parsed.storefront_subtitle.trim()
        ? parsed.storefront_subtitle.trim()
        : "A product edit built from your uploaded aesthetic.",
      vibeTags: normalizeList(parsed.vibe_tags),
      palette: normalizeList(parsed.palette),
      materials: normalizeList(parsed.materials),
      thematicElements: normalizeList(parsed.thematic_elements),
      rationale: typeof parsed.rationale === "string" && parsed.rationale.trim()
        ? parsed.rationale.trim()
        : "These picks align with the image's overall vibe, palette, and materials.",
      products: matchedProducts,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("visual-storefront error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});