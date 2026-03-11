import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { usePlaceOrder } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

type Step = "shipping" | "payment" | "confirmation";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, cartTotal } = useCart();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("shipping");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  if (!user) {
    navigate("/login");
    return null;
  }

  if (items.length === 0 && !orderPlaced) {
    navigate("/cart");
    return null;
  }

  const handlePlaceOrder = async () => {
    await placeOrder.mutateAsync({
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
      })),
      totalAmount: cartTotal,
      shippingAddress: address,
      paymentMethod,
    });
    setOrderPlaced(true);
    setStep("confirmation");
  };

  if (step === "confirmation" && orderPlaced) {
    return (
      <Layout>
        <div className="container py-20 text-center animate-fade-in max-w-md mx-auto">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold">Order Confirmed!</h1>
          <p className="text-muted-foreground mt-2">
            Your order has been placed successfully. Stock has been updated.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={() => navigate("/orders")}>View Orders</Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const steps: { key: Step; label: string }[] = [
    { key: "shipping", label: "Shipping" },
    { key: "payment", label: "Payment" },
    { key: "confirmation", label: "Confirm" },
  ];

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : steps.indexOf(steps.find((x) => x.key === step)!) > i
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === "shipping" && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-heading text-xl font-bold">Shipping Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} placeholder="Rahul Sharma" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <Label>Street Address</Label>
              <Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="123 MG Road" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="Mumbai" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="Maharashtra" />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} placeholder="400001" />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep("payment")}
                disabled={!address.fullName || !address.street || !address.city || !address.state || !address.pincode}
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-heading text-xl font-bold">Payment Method</h2>
            <div className="space-y-3">
              {[
                { value: "cod", label: "Cash on Delivery" },
                { value: "upi", label: "UPI / Google Pay" },
                { value: "card", label: "Credit / Debit Card" },
                { value: "netbanking", label: "Net Banking" },
              ].map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === m.value ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.value}
                    checked={paymentMethod === m.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="font-medium text-sm">{m.label}</span>
                </label>
              ))}
            </div>

            <div className="border-t pt-4 mt-6">
              <h3 className="font-heading font-semibold mb-2">Order Summary</h3>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span>{item.product.title} × {item.quantity}</span>
                  <span>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                <span>Total</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("shipping")}>Back</Button>
              <Button onClick={handlePlaceOrder} disabled={placeOrder.isPending}>
                {placeOrder.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
