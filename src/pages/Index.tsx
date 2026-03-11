import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

const Index = () => {
  const { data: products, isLoading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
      if (selectedCategories.length && !selectedCategories.includes(p.category)) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      return true;
    });
  }, [products, searchQuery, selectedCategories, priceRange]);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-12 md:py-20">
        <div className="container text-center">
          <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight">
            Shop the Best Deals
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Discover quality products across electronics, home, apparel, sports & books — all at amazing prices.
          </p>
          {/* Mobile search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const q = (fd.get("q") as string).trim();
              if (q) setSearchParams({ search: q });
              else setSearchParams({});
            }}
            className="mt-6 md:hidden flex max-w-sm mx-auto"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="Search products..."
                className="w-full rounded-lg border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </form>
        </div>
      </section>

      <div className="container py-8">
        <div className="flex gap-8">
          {/* Sidebar filters - desktop */}
          <div className="hidden lg:block w-56 shrink-0">
            <ProductFilters
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              maxPrice={maxPrice}
            />
          </div>

          {/* Mobile filter toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="text-sm font-medium text-primary underline"
            >
              {mobileFiltersOpen ? "Hide Filters" : "Show Filters"}
            </button>
            {mobileFiltersOpen && (
              <div className="mt-4 p-4 border rounded-lg bg-card">
                <ProductFilters
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories}
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
              <p className="mb-4 text-sm text-muted-foreground">
                Showing results for "<span className="font-medium text-foreground">{searchQuery}</span>"
                <button className="ml-2 text-primary underline" onClick={() => setSearchParams({})}>
                  Clear
                </button>
              </p>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No products found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
