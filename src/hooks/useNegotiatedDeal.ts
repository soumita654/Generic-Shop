import { useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/hooks/useCart";

const SESSION_KEY = "genericshop.negotiated-deal.v1";
export const MAX_NEGOTIATION_DISCOUNT_PERCENT = 20;

export interface NegotiatedDeal {
  percent: number;
  reason: string;
  code: string;
  cartFingerprint: string;
  appliedAt: string;
}

function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(MAX_NEGOTIATION_DISCOUNT_PERCENT, Math.max(0, percent));
}

export function buildCartFingerprint(items: CartItem[]): string {
  return items
    .map((item) => `${item.product.id}:${item.quantity}:${item.product.price}`)
    .sort()
    .join("|");
}

function readStoredDeal(): NegotiatedDeal | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<NegotiatedDeal>;
    if (
      typeof parsed.percent !== "number" ||
      typeof parsed.reason !== "string" ||
      typeof parsed.code !== "string" ||
      typeof parsed.cartFingerprint !== "string" ||
      typeof parsed.appliedAt !== "string"
    ) {
      return null;
    }

    return {
      percent: clampPercent(parsed.percent),
      reason: parsed.reason,
      code: parsed.code,
      cartFingerprint: parsed.cartFingerprint,
      appliedAt: parsed.appliedAt,
    };
  } catch {
    return null;
  }
}

function writeStoredDeal(deal: NegotiatedDeal | null) {
  if (typeof window === "undefined") return;
  if (!deal) {
    window.sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(deal));
}

export function useNegotiatedDeal(items: CartItem[]) {
  const cartFingerprint = useMemo(() => buildCartFingerprint(items), [items]);
  const [storedDeal, setStoredDeal] = useState<NegotiatedDeal | null>(() => readStoredDeal());

  const activeDeal = useMemo(() => {
    if (!storedDeal) return null;
    if (storedDeal.cartFingerprint !== cartFingerprint) return null;
    if (storedDeal.percent <= 0) return null;
    return storedDeal;
  }, [storedDeal, cartFingerprint]);

  useEffect(() => {
    if (storedDeal && storedDeal.cartFingerprint !== cartFingerprint) {
      setStoredDeal(null);
      writeStoredDeal(null);
    }
  }, [storedDeal, cartFingerprint]);

  const applyDeal = (percent: number, reason: string, code?: string) => {
    const normalized = clampPercent(percent);
    if (normalized <= 0) {
      clearDeal();
      return null;
    }

    const next: NegotiatedDeal = {
      percent: normalized,
      reason: reason || "Negotiated discount",
      code: code && code.trim() ? code.trim().toUpperCase() : `NEGOTIATE${normalized}`,
      cartFingerprint,
      appliedAt: new Date().toISOString(),
    };

    setStoredDeal(next);
    writeStoredDeal(next);
    return next;
  };

  const clearDeal = () => {
    setStoredDeal(null);
    writeStoredDeal(null);
  };

  return {
    activeDeal,
    maxDiscountPercent: MAX_NEGOTIATION_DISCOUNT_PERCENT,
    applyDeal,
    clearDeal,
  };
}
