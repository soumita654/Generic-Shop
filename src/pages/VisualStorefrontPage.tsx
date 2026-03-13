import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Palette, Sparkles, SwatchBook } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { useVisualStorefront } from "@/hooks/useVisualStorefront";

function ChipGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_40px_-30px_hsl(var(--foreground)/0.5)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-border/70 bg-background px-3 py-1 text-sm text-foreground">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function VisualStorefrontPage() {
  const navigate = useNavigate();
  const { result, clearResult } = useVisualStorefront();

  if (!result) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-heading text-3xl font-bold">No visual storefront yet</h1>
          <p className="mt-3 text-muted-foreground">
            Upload an inspiration image first and we will generate a curated product edit from your catalog.
          </p>
          <Button asChild className="mt-6 rounded-2xl">
            <Link to="/">Go to Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.20),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.18),_transparent_28%),linear-gradient(180deg,rgba(255,251,235,0.95),rgba(255,255,255,0.98))] py-12 md:py-16">
        <div className="container space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/") }>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to catalog
            </Button>
            <Button
              variant="ghost"
              className="rounded-2xl"
              onClick={() => {
                clearResult();
                navigate("/");
              }}
            >
              Try another image
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/70 shadow-[0_35px_70px_-45px_hsl(var(--foreground)/0.55)] backdrop-blur-sm">
              <img src={result.imagePreview} alt={result.storefrontTitle} className="aspect-[4/5] w-full object-cover" />
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900">
                <Sparkles className="h-3.5 w-3.5" />
                Custom storefront
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  {result.storefrontTitle}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
                  {result.storefrontSubtitle}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {result.rationale}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_18px_40px_-30px_hsl(var(--foreground)/0.5)]">
                  <Palette className="h-5 w-5 text-slate-900" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Palette</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{result.palette.slice(0, 3).join(" • ") || "Mixed tones"}</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_18px_40px_-30px_hsl(var(--foreground)/0.5)]">
                  <SwatchBook className="h-5 w-5 text-slate-900" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Materials</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{result.materials.slice(0, 3).join(" • ") || "Mixed textures"}</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_18px_40px_-30px_hsl(var(--foreground)/0.5)]">
                  <Sparkles className="h-5 w-5 text-slate-900" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Vibe</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{result.vibeTags.slice(0, 3).join(" • ") || "Curated aesthetic"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <ChipGroup title="Vibe Tags" items={result.vibeTags} />
            <ChipGroup title="Colour Story" items={result.palette} />
            <ChipGroup title="Materials & Themes" items={[...result.materials, ...result.thematicElements]} />
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold">Matched Product Edit</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing {result.products.length} catalog products matched to the uploaded image.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}