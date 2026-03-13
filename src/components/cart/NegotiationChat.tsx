import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, BadgePercent, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/hooks/useCart";
import { MAX_NEGOTIATION_DISCOUNT_PERCENT } from "@/hooks/useNegotiatedDeal";
import { useAuth } from "@/contexts/AuthContext";

type Msg = { role: "user" | "assistant"; content: string };

const NEGOTIATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/negotiate-price`;

interface NegotiationChatProps {
  items: CartItem[];
  cartTotal: number;
  onDiscountApplied: (percent: number, reason: string, code?: string) => void;
  currentDiscount: number;
}

export function NegotiationChat({ items, cartTotal, onDiscountApplied, currentDiscount }: NegotiationChatProps) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const cart = items.map((i) => ({
    title: i.product.title,
    price: i.product.price,
    quantity: i.quantity,
  }));

  const send = async (text: string) => {
    const userMsg: Msg = { role: "user", content: text };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const toolCallState = new Map<number, { name: string; args: string }>();
    let discountApplied = false;

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(NEGOTIATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Prefer the user's JWT so the edge function can look up customer stats;
          // fall back to anon key for unauthenticated sessions.
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMsgs,
          cart,
          current_discount_percent: currentDiscount,
          cart_total: cartTotal,
        }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        upsert(`⚠️ ${body.error || "Something went wrong"}`);
        setLoading(false);
        return;
      }

      if (!resp.body) { upsert("⚠️ No response"); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) upsert(delta.content);
            // Handle tool calls
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = typeof tc.index === "number" ? tc.index : 0;
                const prev = toolCallState.get(idx) ?? { name: "", args: "" };
                toolCallState.set(idx, {
                  name: tc.function?.name ?? prev.name,
                  args: prev.args + (tc.function?.arguments ?? ""),
                });
              }
            }
            // Check finish reason
            if (parsed.choices?.[0]?.finish_reason === "tool_calls" || parsed.choices?.[0]?.finish_reason === "stop") {
              if (!discountApplied) {
                discountApplied = applyAutonomousDiscount(toolCallState, currentDiscount, onDiscountApplied);
              }
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      // Final check in case finish reason wasn't emitted.
      if (!discountApplied) {
        applyAutonomousDiscount(toolCallState, currentDiscount, onDiscountApplied);
      }

      setLoading(false);
    } catch {
      upsert("⚠️ Failed to connect. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    send(input.trim());
  };

  const STARTERS = [
    "Can I get a discount on my cart?",
    "This is too expensive, I might leave...",
    "Any deals for a loyal customer?",
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <BadgePercent className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Price Negotiator</h3>
          <p className="text-xs text-muted-foreground">Try your luck — ask for a deal!</p>
        </div>
        {currentDiscount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-600">
            <Sparkles className="h-3 w-3" />
            {currentDiscount}% OFF
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-64 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              💰 Think the price is too high? Try negotiating!
            </p>
            <div className="space-y-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" && "justify-end")}>
            {m.role === "assistant" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              )}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Make your case..."
          disabled={loading}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/35 disabled:opacity-50"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-xl shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function applyAutonomousDiscount(
  toolCalls: Map<number, { name: string; args: string }>,
  currentDiscount: number,
  onDiscountApplied: (percent: number, reason: string, code?: string) => void
): boolean {
  for (const tc of toolCalls.values()) {
    if (tc.name !== "apply_discount" || !tc.args) continue;
    try {
      const args = JSON.parse(tc.args) as { discount_percent?: number; reason?: string; discount_code?: string };
      const requested = Math.min(MAX_NEGOTIATION_DISCOUNT_PERCENT, Math.max(0, Number(args.discount_percent) || 0));
      const pct = Math.max(currentDiscount, requested);
      if (pct <= 0) continue;
      onDiscountApplied(pct, args.reason || "Negotiated discount", args.discount_code);
      return true;
    } catch {
      // Ignore malformed partial tool-call payloads.
    }
  }

  return false;
}
