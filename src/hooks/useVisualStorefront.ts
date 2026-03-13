import { useState } from "react";
import type { Product } from "@/hooks/useProducts";

const STORAGE_KEY = "genericshop.visual-storefront.v1";

export interface VisualStorefrontResult {
  storefrontTitle: string;
  storefrontSubtitle: string;
  vibeTags: string[];
  palette: string[];
  materials: string[];
  thematicElements: string[];
  rationale: string;
  products: Product[];
  imagePreview: string;
  generatedAt: string;
}

function readResult(): VisualStorefrontResult | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as VisualStorefrontResult;
  } catch {
    return null;
  }
}

function writeResult(result: VisualStorefrontResult | null) {
  if (typeof window === "undefined") return;

  if (!result) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function useVisualStorefront() {
  const [result, setResult] = useState<VisualStorefrontResult | null>(() => readResult());

  const saveResult = (next: Omit<VisualStorefrontResult, "generatedAt">) => {
    const payload: VisualStorefrontResult = {
      ...next,
      generatedAt: new Date().toISOString(),
    };

    setResult(payload);
    writeResult(payload);
    return payload;
  };

  const clearResult = () => {
    setResult(null);
    writeResult(null);
  };

  return {
    result,
    saveResult,
    clearResult,
  };
}