import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { type Product, useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { StockBadge } from "@/components/products/StockBadge";
import { formatPrice, getStockStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, ArrowLeft, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";

type ProductReview = {
  id: string;
  author: string;
  title: string;
  rating: number;
  body: string;
  date: string;
  verified: boolean;
};

const REVIEW_AUTHORS = ["Aarav S.", "Priya M.", "Rohan K.", "Sneha P.", "Vikram T.", "Neha R."];
const REVIEW_HEADLINES = [
  "Worth the price",
  "Solid everyday pick",
  "Better than expected",
  "Great quality and finish",
  "Would buy again",
  "Fits my needs perfectly",
];
const REVIEW_TEMPLATES = [
  "The build quality feels dependable and the product matched the photos. Delivery was smooth and setup was straightforward.",
  "I have been using it regularly and it performs consistently. The overall finish and value for money stand out.",
  "This was a practical upgrade for my routine. It feels well-made, easy to use, and the description was accurate.",
  "The design is clean and the day-to-day experience has been good so far. I would confidently recommend it to others.",
];

function hashValue(value: string) {
  return Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function getSeededReviews(product: Product | undefined): ProductReview[] {
  if (!product) return [];

  const seed = hashValue(product.id + product.title);

  return Array.from({ length: 4 }, (_, index) => {
    const rating = 4 + ((seed + index) % 2);
    const author = REVIEW_AUTHORS[(seed + index) % REVIEW_AUTHORS.length];
    const title = REVIEW_HEADLINES[(seed + index) % REVIEW_HEADLINES.length];
    const template = REVIEW_TEMPLATES[(seed + index) % REVIEW_TEMPLATES.length];
    const daysAgo = ((seed + 1) * (index + 2)) % 45 + 3;
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      id: `${product.id}-${index}`,
      author,
      title,
      rating,
      body: `${template} Especially for ${product.category.toLowerCase()} shopping, this one feels like a reliable choice.`,
      date,
      verified: (seed + index) % 3 !== 0,
    };
  });
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { data: products, isLoading: isProductsLoading } = useProducts();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const relatedProducts = useMemo(() => {
    if (!product || !products) return [];

    return products
      .filter((candidate) => candidate.id !== product.id && candidate.category === product.category)
      .sort((left, right) => Math.abs(left.price - product.price) - Math.abs(right.price - product.price))
      .slice(0, 4);
  }, [product, products]);
  const reviews = useMemo(() => getSeededReviews(product), [product]);
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

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

        <Separator className="my-10" />

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold">You may also like</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Similar picks from {product.category} based on this item.
              </p>
            </div>
          </div>

          {isProductsLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                More suggestions will appear as soon as similar products are available in this category.
              </CardContent>
            </Card>
          )}
        </section>

        <Separator className="my-10" />

        <section className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold">Customer reviews</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Recent buyer feedback for this product.
              </p>
            </div>
            <Card className="w-full md:w-auto md:min-w-64">
              <CardHeader className="pb-3">
                <CardDescription>Average rating</CardDescription>
                <CardTitle className="flex items-center gap-3 text-3xl">
                  {averageRating.toFixed(1)}
                  <span className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-5 w-5 ${index < Math.round(averageRating) ? "fill-current" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Based on {reviews.length} recent reviews.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{review.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {review.author} • {review.date}
                      </CardDescription>
                    </div>
                    {review.verified ? (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Verified purchase
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${index < review.rating ? "fill-current" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{review.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
