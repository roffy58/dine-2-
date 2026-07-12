import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderFormSchema, type OrderFormData } from "../schemas/orderSchema";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";

// Stripe Promise function
const getStripe = () => loadStripe("pk_test_YOUR_PUBLISHABLE_KEY");

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderModal({ isOpen, onClose, onSuccess }: OrderModalProps) {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [paymentType, setPaymentType] = useState<"card" | "cash" | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWaiting && orderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/${orderId}`);
          const data = await res.json();
          if (data.status === "confirmed") {
            toast.success("✅ Payment confirmed by waiter!");
            setIsWaiting(false);
            clearCart();
            onSuccess();
            onClose();
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isWaiting, orderId]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { tableNumber: "", customerName: "", notes: "" },
  });

  const onSubmit = async (data: OrderFormData) => {
    if (!paymentType) {
      toast.error("Please select a payment method!");
      return;
    }

    try {
      const newOrder = {
        table_no: data.tableNumber,
        customer_name: data.customerName,
        items: cart,
        total: getTotalPrice().toString(),
        notes: data.notes || "",
        paymentType: paymentType,
        paymentStatus: paymentType === "card" ? "paid" : "pending",
        status: "pending",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error("Failed to place order");

      if (paymentType === "cash") {
        setOrderId(responseData.order.id);
        setIsWaiting(true);
      } else {
        // Stripe Payment Flow (Cleaned)
        const sessionRes = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart, total: getTotalPrice() }),
        });
        
        const sessionData = await sessionRes.json();
        
        if (sessionRes.ok && sessionData.sessionId) {
          const stripe = await getStripe();
          const { error } = await stripe!.redirectToCheckout({ sessionId: sessionData.sessionId });
          if (error) {
            throw new Error(error.message);
          }
        } else {
          throw new Error(sessionData.message || "Failed to initiate payment");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "❌ Something went wrong.");
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="bg-card border p-6 rounded-2xl w-full max-w-md shadow-xl">
        {isWaiting ? (
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-primary">Waiting for Confirmation</h2>
            <p className="mt-2 text-muted-foreground">Please wait while the waiter confirms your cash payment.</p>
            <div className="mt-4 animate-pulse text-sm font-semibold">Checking status...</div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Complete Order</h2>
              <Button variant="ghost" onClick={onClose} size="sm">✕</Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex gap-2">
                  <Button type="button" variant={paymentType === "card" ? "default" : "outline"} onClick={() => setPaymentType("card")} className="flex-1">Card / UPI</Button>
                  <Button type="button" variant={paymentType === "cash" ? "default" : "outline"} onClick={() => setPaymentType("cash")} className="flex-1">Cash</Button>
                </div>

                <FormField control={form.control} name="tableNumber" render={({ field }) => (
                  <FormItem><FormLabel>Table No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <Button type="submit" className="w-full">Confirm Order</Button>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
