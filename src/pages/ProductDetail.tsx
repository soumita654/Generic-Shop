import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { StockBadge } from "@/components/products/StockBadge";
import { formatPrice, getStockStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-10">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">Product not found</div>
      </Layout>
    );
  }

  const stockStatus = getStockStatus(product.stock_quantity);

  return (
    <Layout>
      <div className="container py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {product.category}
            </span>
            <h1 className="mt-2 font-heading text-2xl md:text-3xl font-bold">{product.title}</h1>
            <p className="mt-2 text-2xl font-bold text-primary">{formatPrice(product.price)}</p>

            <div className="mt-4">
              <StockBadge quantity={product.stock_quantity} />
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button
                  className="px-3 py-2 text-lg hover:bg-muted transition-colors"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  −
                </button>
                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{qty}</span>
                <button
                  className="px-3 py-2 text-lg hover:bg-muted transition-colors"
                  onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}
                >
                  +
                </button>
              </div>

              <Button
                size="lg"
                disabled={stockStatus === "out" || addToCart.isPending}
                onClick={() => {
                  if (!user) { navigate("/login"); return; }
                  addToCart.mutate({ productId: product.id, quantity: qty });
                }}
                className="flex-1"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
