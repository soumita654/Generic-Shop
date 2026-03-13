import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/lib/constants";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Star, Smartphone, Home, Shirt, Dumbbell, BookOpen, Sparkles, ShoppingBag, Zap, Heart } from "lucide-react";

const Index = () => {
  const { data: products, isLoading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";
  const selectedCategories = useMemo(
    () => searchParams.getAll("category").filter((category): category is (typeof CATEGORIES)[number] => CATEGORIES.includes(category as (typeof CATEGORIES)[number])),
    [searchParams]
  );
  const [trendingTab, setTrendingTab] = useState("All");

  const maxPrice = useMemo(
    () => Math.ceil((products ?? []).reduce((m, p) => Math.max(m, p.price), 0) / 100) * 100 || 50000,
    [products]
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const filtered = useMemo(() => {
    if (!products) return [];
    let filteredProducts = products.filter((p) => {
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (trendingTab !== "All" && selectedCategories.length && !selectedCategories.includes(p.category as typeof selectedCategories[number])) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      return true;
    });

    // Filter by trending tab
    if (trendingTab !== "All") {
      filteredProducts = filteredProducts.filter(p => p.category === trendingTab);
    }

    return filteredProducts;
  }, [products, searchQuery, selectedCategories, priceRange, trendingTab]);

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

  const categoryIcons = {
    "Electronics": Smartphone,
    "Home & Kitchen": Home,
    "Apparel": Shirt,
    "Sports & Fitness": Dumbbell,
    "Books": BookOpen,
  };

  const promotionalBanners = [
    { title: "Smart Home Essentials", icon: Zap, color: "from-pink-400 to-rose-500" },
    { title: "Electronics Deals", icon: Smartphone, color: "from-purple-400 to-pink-500" },
    { title: "Daily Essentials", icon: ShoppingBag, color: "from-blue-400 to-purple-500" },
    { title: "Top Gadgets", icon: Sparkles, color: "from-green-400 to-blue-500" },
  ];

  const bestSellers = products?.slice(0, 6) || []; // Mock best sellers, in real app would be based on sales data

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden py-14 md:py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20">
        <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-pink-200/30 dark:bg-pink-800/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-0 h-52 w-52 rounded-full bg-purple-200/30 dark:bg-purple-800/20 blur-3xl" />
        <div className="container text-center">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border/75 bg-white/80 dark:bg-card/80 px-6 py-10 shadow-[0_22px_45px_-30px_hsl(var(--foreground)/0.3)] backdrop-blur-sm md:px-12">
            <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
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
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search products..."
                  className="w-full rounded-xl border border-border/80 bg-background py-2.5 pl-4 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/35"
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {CATEGORIES.map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              return (
                <button
                  key={category}
                  onClick={() => updateSelectedCategories([category])}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-white to-pink-50 dark:from-card dark:to-purple-950/20 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-200/50 dark:hover:shadow-purple-800/50 hover:bg-gradient-to-br hover:from-pink-100 hover:to-purple-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800 text-pink-700 dark:text-pink-300 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-8 w-8" />
                  </div>
                  <span className="text-center text-sm font-medium text-foreground">{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-12">
        <div className="container">
          <h2 className="mb-8 text-center font-heading text-2xl font-bold md:text-3xl">Trending Products</h2>
          <div className="mb-8 flex justify-center">
            <ToggleGroup
              type="single"
              value={trendingTab}
              onValueChange={(value) => value && setTrendingTab(value)}
              className="rounded-2xl border border-border/60 bg-card/50 p-1 shadow-sm"
            >
              <ToggleGroupItem value="All" className="rounded-xl px-6 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                All
              </ToggleGroupItem>
              {CATEGORIES.map((category) => (
                <ToggleGroupItem key={category} value={category} className="rounded-xl px-6 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  {category}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Price Filter */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <Label className="text-sm font-medium text-foreground">Price Range: ₹{priceRange[0].toLocaleString("en-IN")} - ₹{priceRange[1].toLocaleString("en-IN")}</Label>
            <Slider
              min={0}
              max={maxPrice}
              step={100}
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as [number, number])}
              className="w-full max-w-md"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-2xl" />
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {promotionalBanners.map((banner, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${banner.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="relative flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                    <banner.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-sm font-semibold text-foreground">{banner.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12">
        <div className="container">
          <h2 className="mb-8 text-center font-heading text-2xl font-bold md:text-3xl">Best Sellers</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {bestSellers.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-64">
                <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-sm font-semibold line-clamp-2 mb-2">{product.title}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">(4.8)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-lg font-bold text-foreground">₹{product.price}</span>
                      <button className="rounded-lg border border-border/60 bg-background/50 p-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors">
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
