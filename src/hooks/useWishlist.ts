import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    title: string;
    category: string;
    price: number;
    image_url: string;
    stock_quantity: number;
  };
}

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const wishlistQuery = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*, product:products(id, title, category, price, image_url, stock_quantity)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as WishlistItem[]) ?? [];
    },
    enabled: !!user,
  });

  const addToWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const { data: existing } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user!.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) return;

      const { error } = await supabase
        .from("wishlist_items")
        .insert({ user_id: user!.id, product_id: productId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to wishlist");
    },
    onError: () => toast.error("Failed to add to wishlist"),
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user!.id)
        .eq("product_id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: () => toast.error("Failed to remove from wishlist"),
  });

  const toggleWishlist = useMutation({
    mutationFn: async ({ productId, isWishlisted }: { productId: string; isWishlisted: boolean }) => {
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user!.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlist_items")
          .insert({ user_id: user!.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(vars.isWishlisted ? "Removed from wishlist" : "Added to wishlist");
    },
    onError: () => toast.error("Could not update wishlist"),
  });

  const items = wishlistQuery.data ?? [];
  const wishlistCount = items.length;
  const isWishlisted = (productId: string) => items.some((item) => item.product_id === productId);

  return {
    items,
    isLoading: wishlistQuery.isLoading,
    wishlistCount,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  };
}
