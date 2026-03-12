import { CATEGORIES } from "@/lib/constants";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductFiltersProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  maxPrice: number;
}

export function ProductFilters({
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  maxPrice,
}: ProductFiltersProps) {
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      onCategoryChange(selectedCategories.filter((c) => c !== cat));
    } else {
      onCategoryChange([...selectedCategories, cat]);
    }
  };

  return (
    <aside className="section-shell space-y-7 p-5">
      <div>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Categories</h3>
        <div className="space-y-2.5">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary">
              <Checkbox
                checked={selectedCategories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Price Range</h3>
        <Slider
          min={0}
          max={maxPrice}
          step={100}
          value={priceRange}
          onValueChange={(v) => onPriceRangeChange(v as [number, number])}
          className="mb-2"
        />
        <div className="mt-3 flex justify-between rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
          <span>₹{priceRange[0].toLocaleString("en-IN")}</span>
          <span>₹{priceRange[1].toLocaleString("en-IN")}</span>
        </div>
      </div>
    </aside>
  );
}
