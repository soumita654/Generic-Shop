import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { HeartOff, ShoppingCart, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function WishlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground mb-4">Please login to view your wishlist</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="font-heading text-2xl font-bold mb-6">My Wishlist</h1>
        <WishlistContent />
      </div>
    </Layout>
  );
}

function WishlistContent() {
  const { items, isLoading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (isLoading) return <p className="text-muted-foreground">Loading wishlist...</p>;

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
        <Button asChild variant="outline">
          <Link to="/">Discover Products</Link>
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
            <p className="text-xs text-muted-foreground mt-0.5">{item.product.category}</p>
            <p className="text-sm font-bold mt-1">{formatPrice(item.product.price)}</p>
          </div>

          <div className="flex flex-col items-end justify-between gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await addToCart.mutateAsync({ productId: item.product.id });
              }}
              disabled={addToCart.isPending}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>

            <button
              onClick={() => removeFromWishlist.mutate(item.product.id)}
              className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between border-t border-border/70 pt-4">
        <span className="text-sm text-muted-foreground">{items.length} item(s) saved for later</span>
        <Button asChild variant="outline">
          <Link to="/cart">
            <HeartOff className="mr-2 h-4 w-4" />
            Go to Cart
          </Link>
        </Button>
      </div>
    </div>
  );
}
