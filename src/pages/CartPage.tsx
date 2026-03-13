import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, BadgePercent } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { NegotiationChat } from "@/components/cart/NegotiationChat";
import { toast } from "sonner";
import { useNegotiatedDeal } from "@/hooks/useNegotiatedDeal";

export default function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground mb-4">Please login to view your cart</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="font-heading text-2xl font-bold mb-6">Shopping Cart</h1>
        <CartContent />
      </div>
    </Layout>
  );
}

function CartContent() {
  const { items, isLoading, cartTotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { activeDeal, applyDeal } = useNegotiatedDeal(items);

  if (isLoading) return <p className="text-muted-foreground">Loading cart...</p>;

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button asChild variant="outline">
          <Link to="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const discountAmount = activeDeal ? cartTotal * (activeDeal.percent / 100) : 0;
  const finalTotal = cartTotal - discountAmount;

  const handleDiscountApplied = (percent: number, reason: string, code?: string) => {
    const applied = applyDeal(percent, reason, code);
    if (!applied) return;
    toast.success(`🎉 ${applied.percent}% discount applied with code ${applied.code}! ${applied.reason}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      {/* Cart items - left column */}
      <div className="lg:col-span-3 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-2xl border border-border/80 bg-card/90 p-4 shadow-[0_12px_26px_-22px_hsl(var(--foreground)/0.6)]">
            <img
              src={item.product.image_url || "/placeholder.svg"}
              alt={item.product.title}
              className="h-20 w-20 rounded-md object-cover bg-muted"
            />
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.product.id}`} className="font-heading text-sm font-semibold hover:underline line-clamp-1">
                {item.product.title}
              </Link>
              <p className="text-sm font-bold mt-1">{formatPrice(item.product.price)}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: Math.min(item.product.stock_quantity, item.quantity + 1) })}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <span className="font-bold text-sm">{formatPrice(item.product.price * item.quantity)}</span>
              <button
                onClick={() => removeFromCart.mutate(item.id)}
                className="text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Price summary */}
        <div className="border-t border-border/70 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          {activeDeal && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-green-600">
                <BadgePercent className="h-3.5 w-3.5" />
                Negotiated Discount ({activeDeal.percent}%)
              </span>
              <span className="text-green-600">-{formatPrice(discountAmount)}</span>
            </div>
          )}
          {activeDeal && (
            <div className="text-xs text-green-700">
              Applied code: <span className="font-semibold">{activeDeal.code}</span> • {activeDeal.reason}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border/70 pt-2">
            <span className="font-heading text-lg font-bold">
              Total: {formatPrice(finalTotal)}
            </span>
            <Button size="lg" onClick={() => navigate("/checkout")}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>

      {/* Negotiation chat - right column */}
      <div className="lg:col-span-2">
        <NegotiationChat
          items={items}
          cartTotal={cartTotal}
          onDiscountApplied={handleDiscountApplied}
          currentDiscount={activeDeal?.percent ?? 0}
        />
      </div>
    </div>
  );
}
