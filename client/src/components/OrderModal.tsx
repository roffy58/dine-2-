import { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderFormSchema, type OrderFormData } from "../schemas/orderSchema";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_dummy";
const getStripe = () => loadStripe(STRIPE_PUBLIC_KEY);

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderModal({ isOpen, onClose, onSuccess }: OrderModalProps) {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [paymentType, setPaymentType] = useState<"card" | "cash" | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showDemoPayment, setShowDemoPayment] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { tableNumber: "", customerName: "", notes: "" },
  });

  const onSubmit = async (data: OrderFormData) => {
    if (!paymentType) { toast.error("Select a payment method!"); return; }

    try {
      // build order payload (kept same shape)
      const newOrder = {
        table_no: String(data.tableNumber),
        customer_name: String(data.customerName),
        items: cart,
        total: getTotalPrice().toString(),
        notes: data.notes || "",
        paymentType: paymentType,
        paymentStatus: paymentType === "card" ? "paid" : "pending",
        status: "pending",
      };

      // CASH: keep existing behavior - POST immediately
      if (paymentType === "cash") {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newOrder),
        });
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.message || "Order failed");
        setIsWaiting(true);
        return;
      }

      // CARD (Stripe): save pending order locally, then create checkout session & redirect
      if (STRIPE_PUBLIC_KEY.startsWith("pk_test_") && STRIPE_PUBLIC_KEY !== "pk_test_dummy") {
        localStorage.setItem("pending_order", JSON.stringify(newOrder));

        const sessionRes = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart, total: getTotalPrice() }),
        });
        const sessionData = await sessionRes.json();

        if (sessionData.sessionId) {
          const stripe = await getStripe();
          await stripe?.redirectToCheckout({ sessionId: sessionData.sessionId });
        } else {
          throw new Error(sessionData.message || "Failed to create Stripe session");
        }

        return;
      }

      // Demo payment path: save pending order and show demo UI (demo Pay Now will POST it)
      localStorage.setItem("pending_order", JSON.stringify(newOrder));
      setShowDemoPayment(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  // Demo Pay Now handler — posts pending_order then shows success
  const handleDemoPay = async () => {
    try {
      const raw = localStorage.getItem("pending_order");
      if (!raw) throw new Error("No pending order found");
      const pending = JSON.parse(raw);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "Order failed");

      toast.success("Payment Successful!");
      clearCart();
      localStorage.removeItem("pending_order");
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white text-black p-6 rounded-2xl w-full max-w-md shadow-2xl border">
        {showDemoPayment ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Demo Payment</h2>
            <Input placeholder="Card Number" />
            <div className="flex gap-2"> <Input placeholder="MM/YY" /> <Input placeholder="CVC" /> </div>
            <Button className="w-full" onClick={handleDemoPay}>Pay Now</Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowDemoPayment(false)}>Back</Button>
          </div>
        ) : isWaiting ? (
          <div className="text-center py-6 text-black font-bold">Waiting for Waiter...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-2">
                <Button type="button" variant={paymentType === "card" ? "default" : "outline"} onClick={() => setPaymentType("card")} className="flex-1">Card</Button>
                <Button type="button" variant={paymentType === "cash" ? "default" : "outline"} onClick={() => setPaymentType("cash")} className="flex-1">Cash</Button>
              </div>
              <FormField control={form.control} name="tableNumber" render={({field}) => <FormItem><FormLabel>Table No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
              <FormField control={form.control} name="customerName" render={({field}) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
              <Button type="submit" className="w-full">Confirm</Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
