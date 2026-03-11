import { getStockStatus, getStockLabel } from "@/lib/constants";

export function StockBadge({ quantity }: { quantity: number }) {
  const status = getStockStatus(quantity);
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
        status === "in"
          ? "stock-badge-in"
          : status === "low"
          ? "stock-badge-low"
          : "stock-badge-out"
      }`}
    >
      {getStockLabel(quantity)}
    </span>
  );
}
