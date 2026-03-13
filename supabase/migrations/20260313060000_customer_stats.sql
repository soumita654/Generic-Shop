-- Add purchase-frequency and discount-tracking columns to profiles.
-- These power the dynamic negotiation discount rules:
--   • purchase_count  – how many completed orders the user has
--   • total_order_value – cumulative gross (pre-discount) order value
--   • total_discount_given – cumulative discount rupees given to this user

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS purchase_count       INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_order_value    NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_discount_given NUMERIC(12,2) NOT NULL DEFAULT 0;

-- -----------------------------------------------------------------------
-- RPC: update_customer_stats
-- Called server-side after every successful order.
-- Uses auth.uid() so no user can tamper with another user's stats.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_customer_stats(
  p_order_total    NUMERIC,
  p_discount_given NUMERIC DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    purchase_count       = purchase_count       + 1,
    total_order_value    = total_order_value    + GREATEST(0, p_order_total),
    total_discount_given = total_discount_given + GREATEST(0, p_discount_given),
    updated_at           = now()
  WHERE id = auth.uid();
END;
$$;

-- Allow every authenticated user to call (SECURITY DEFINER enforces auth.uid() scope)
GRANT EXECUTE ON FUNCTION public.update_customer_stats(NUMERIC, NUMERIC) TO authenticated;
