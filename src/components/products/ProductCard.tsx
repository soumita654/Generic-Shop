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
      className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md animate-fade-in"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 left-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-current text-red-500" : ""}`} />
        </button>
        <span
          className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
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
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {product.category}
        </span>
        <h3 className="mt-1 font-heading text-sm font-semibold leading-tight line-clamp-2">
          {product.title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-heading text-lg font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          <Button
            size="sm"
            disabled={stockStatus === "out" || addToCart.isPending}
            onClick={handleAddToCart}
            className="h-8 w-8 p-0"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
