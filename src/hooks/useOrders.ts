import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_address: Record<string, string>;
  payment_method: string;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export function useOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });
}

interface PlaceOrderParams {
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  shippingAddress: Record<string, string>;
  paymentMethod: string;
}

export function usePlaceOrder() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, totalAmount, shippingAddress, paymentMethod }: PlaceOrderParams) => {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          payment_method: paymentMethod,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Decrement stock for each item
      for (const item of items) {
        const { error: stockError } = await supabase.rpc("decrement_stock", {
          p_product_id: item.productId,
          p_quantity: item.quantity,
        });
        if (stockError) throw stockError;
      }

      // Clear cart
      await supabase.from("cart_items").delete().eq("user_id", user!.id);

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Order placed successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to place order");
    },
  });
}
