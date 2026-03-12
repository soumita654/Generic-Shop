import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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
      <div className="container py-8 max-w-3xl">
        <h1 className="font-heading text-2xl font-bold mb-6">Shopping Cart</h1>
        <CartContent />
      </div>
    </Layout>
  );
}

function CartContent() {
  const { items, isLoading, cartTotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

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

  return (
    <div className="space-y-4 animate-fade-in">
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

      <div className="flex items-center justify-between border-t border-border/70 pt-4">
        <span className="font-heading text-lg font-bold">Total: {formatPrice(cartTotal)}</span>
        <Button size="lg" onClick={() => navigate("/checkout")}>
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
