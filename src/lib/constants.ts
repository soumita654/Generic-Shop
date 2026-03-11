export const CURRENCY_SYMBOL = "₹";
export const CATEGORIES = ["Electronics", "Home & Kitchen", "Apparel", "Sports & Fitness", "Books"] as const;
export type Category = typeof CATEGORIES[number];

export function formatPrice(price: number): string {
  return `${CURRENCY_SYMBOL}${price.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function getStockStatus(qty: number): "in" | "low" | "out" {
  if (qty <= 0) return "out";
  if (qty <= 5) return "low";
  return "in";
}

export function getStockLabel(qty: number): string {
  if (qty <= 0) return "Out of Stock";
  if (qty <= 5) return `Only ${qty} left!`;
  return `${qty} in stock`;
}
