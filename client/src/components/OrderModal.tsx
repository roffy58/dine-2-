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

// Yahan apni Public Key set karo. Demo ke liye 'pk_test_dummy' rakha hai.
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
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showDemoPayment, setShowDemoPayment] = useState(false); // Demo UI State

  // ... (useEffect same rahega)
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
        } catch (e) { console.error("Polling error", e); }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isWaiting, orderId]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { tableNumber: "", customerName: "", notes: "" },
  });

  const onSubmit = async (data: OrderFormData) => {
    if (!paymentType) { toast.error("Please select a payment method!"); return; }

    try {
      const newOrder = {
        table_no: data.tableNumber, customer_name: data.customerName, items: cart,
        total: getTotalPrice().toString(), notes: data.notes || "",
        paymentType: paymentType, paymentStatus: paymentType === "card" ? "paid" : "pending",
        status: "pending",
      };

      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error("Failed to place order");

      if (paymentType === "cash") {
        setOrderId(responseData.order.id);
        setIsWaiting(true);
      } else {
        // --- SMART PAYMENT LOGIC ---
        if (STRIPE_PUBLIC_KEY.startsWith("pk_test_") && STRIPE_PUBLIC_KEY !== "pk_test_dummy") {
          const sessionRes = await fetch("/api/create-checkout-session", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cart, total: getTotalPrice() }),
          });
          const sessionData = await sessionRes.json();
          if (sessionData.sessionId) {
            const stripe = await getStripe();
            await stripe?.redirectToCheckout({ sessionId: sessionData.sessionId });
          }
        } else {
          // Key nahi hai, toh Demo UI dikhao
          setShowDemoPayment(true);
        }
      }
    } catch (error) { toast.error("❌ Something went wrong."); console.error(error); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="bg-card border p-6 rounded-2xl w-full max-w-md shadow-xl">
        {showDemoPayment ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Secure Card Payment (Demo)</h2>
            <Input placeholder="Card Number" />
            <div className="flex gap-2"> <Input placeholder="MM/YY" /> <Input placeholder="CVC" /> </div>
            <Button className="w-full" onClick={() => { toast.success("✅ Payment Successful!"); clearCart(); onSuccess(); onClose(); }}>Pay Now</Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowDemoPayment(false)}>Back</Button>
          </div>
        ) : isWaiting ? (
          // ... (Waiting UI same)
          <div className="text-center py-6"> <h2 className="text-2xl font-bold text-primary">Waiting for Confirmation</h2> </div>
        ) : (
          // ... (Original Form UI same)
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"> {/* ... */}</form></Form>
        )}
      </div>
    </div>
  );
}
