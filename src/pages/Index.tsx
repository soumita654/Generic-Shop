import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

const Index = () => {
  const { data: products, isLoading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";
  const selectedCategories = useMemo(
    () => searchParams.getAll("category").filter((category): category is (typeof CATEGORIES)[number] => CATEGORIES.includes(category as (typeof CATEGORIES)[number])),
    [searchParams]
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const maxPrice = useMemo(
    () => Math.ceil((products ?? []).reduce((m, p) => Math.max(m, p.price), 0) / 100) * 100 || 50000,
    [products]
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategories.length && !selectedCategories.includes(p.category as typeof selectedCategories[number])) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      return true;
    });
  }, [products, searchQuery, selectedCategories, priceRange]);

  const updateSelectedCategories = (categories: string[]) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");

    categories.forEach((category) => {
      nextParams.append("category", category);
    });

    setSearchParams(nextParams);
  };

  const updateSearchQuery = (query: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (query) {
      nextParams.set("search", query);
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-0 h-52 w-52 rounded-full bg-accent/15 blur-3xl" />
        <div className="container text-center">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border/75 bg-card/70 px-6 py-10 shadow-[0_22px_45px_-30px_hsl(var(--foreground)/0.5)] backdrop-blur-sm md:px-12">
            <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight">
            Shop the Best Deals
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm leading-6 md:text-base">
            Discover quality products across electronics, home, apparel, sports & books — all at amazing prices.
            </p>
            {/* Mobile search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const q = (fd.get("q") as string).trim();
                updateSearchQuery(q);
              }}
              className="mt-6 md:hidden flex max-w-sm mx-auto"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search products..."
                  className="w-full rounded-xl border border-border/80 bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/35"
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="container pb-10">
        <div className="flex gap-8">
          {/* Sidebar filters - desktop */}
          <div className="hidden lg:block w-56 shrink-0">
            <ProductFilters
              selectedCategories={selectedCategories}
              onCategoryChange={updateSelectedCategories}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              maxPrice={maxPrice}
            />
          </div>

          {/* Mobile filter toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              {mobileFiltersOpen ? "Hide Filters" : "Show Filters"}
            </button>
            {mobileFiltersOpen && (
              <div className="mt-4">
                <ProductFilters
                  selectedCategories={selectedCategories}
                  onCategoryChange={updateSelectedCategories}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  maxPrice={maxPrice}
                />
              </div>
            )}
          </div>

          {/* Product grid */}
          <div className="flex-1">
            {searchQuery && (
              <p className="mb-4 rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-sm text-muted-foreground">
                Showing results for "<span className="font-medium text-foreground">{searchQuery}</span>"
                <button className="ml-2 text-primary underline" onClick={() => updateSearchQuery("")}>
                  Clear
                </button>
              </p>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="section-shell text-center py-16 text-muted-foreground">
                <p className="text-lg">No products found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
