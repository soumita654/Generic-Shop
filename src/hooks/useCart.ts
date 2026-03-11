import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    stock_quantity: number;
  };
}

export function useCart() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, product:products(id, title, price, image_url, stock_quantity)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data as unknown as CartItem[]) ?? [];
    },
    enabled: !!user,
  });

  const addToCart = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user!.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user!.id, product_id: productId, quantity });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart!");
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeFromCart = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Removed from cart");
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const cartTotal = (cartQuery.data ?? []).reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartCount = (cartQuery.data ?? []).reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: cartQuery.data ?? [],
    isLoading: cartQuery.isLoading,
    cartTotal,
    cartCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
