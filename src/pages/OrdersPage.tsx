import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useOrders();

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground mb-4">Please login to view orders</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <h1 className="font-heading text-2xl font-bold mb-6">Order History</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading orders...</p>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Button asChild variant="outline">
              <Link to="/">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize">
                      {order.status}
                    </span>
                    <p className="font-heading font-bold mt-1">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Payment: {order.payment_method.toUpperCase()}</p>
                  {order.shipping_address && (
                    <p>
                      Ship to: {(order.shipping_address as Record<string, string>).fullName},{" "}
                      {(order.shipping_address as Record<string, string>).city}
                    </p>
                  )}
                  {order.items && (
                    <p className="mt-1">{order.items.length} item(s)</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
