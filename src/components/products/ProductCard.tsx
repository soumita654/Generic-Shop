import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, getStockStatus, getStockLabel } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import type { Product } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const stockStatus = getStockStatus(product.stock_quantity);
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    addToCart.mutate({ productId: product.id });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    toggleWishlist.mutate({ productId: product.id, isWishlisted: wishlisted });
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-[0_18px_35px_-28px_hsl(var(--foreground)/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_26px_40px_-24px_hsl(var(--primary)/0.3)] animate-fade-in"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <button
          onClick={handleWishlistToggle}
          className="absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-current text-red-500" : ""}`} />
        </button>
        <span
          className={`absolute right-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            stockStatus === "in"
              ? "stock-badge-in"
              : stockStatus === "low"
              ? "stock-badge-low"
              : "stock-badge-out"
          }`}
        >
          {getStockLabel(product.stock_quantity)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <span className="inline-flex w-fit rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
          {product.category}
        </span>
        <h3 className="mt-2 font-heading text-sm font-semibold leading-tight line-clamp-2 md:text-base">
          {product.title}
        </h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="font-heading text-lg font-bold text-foreground md:text-xl">
            {formatPrice(product.price)}
          </span>
          <Button
            size="sm"
            disabled={stockStatus === "out" || addToCart.isPending}
            onClick={handleAddToCart}
            className="h-9 rounded-lg px-3"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:text-xs">Add</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
