import { useState, useEffect } from "react";
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
  const [timer, setTimer] = useState(60);
  const [showDemoPayment, setShowDemoPayment] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWaiting && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (isWaiting && timer === 0) {
      setIsWaiting(false);
      toast.error("Payment Timed Out! Please try again.");
      onClose();
    }
    return () => clearInterval(interval);
  }, [isWaiting, timer, onClose]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { tableNumber: "", customerName: "", notes: "" },
  });

  const onSubmit = async (data: OrderFormData) => {
    if (!paymentType) { toast.error("Select a payment method!"); return; }

    try {
      // UPDATED: Backend requirement ke hisaab se id aur restaurant_id add kiya
      const newOrder = {
        id: Date.now().toString(),
        restaurant_id: "dine-2",
        table_no: String(data.tableNumber),
        customer_name: String(data.customerName),
        items: cart,
        total: getTotalPrice().toString(),
        notes: data.notes || "",
        paymentType: paymentType,
        paymentStatus: "pending",
        status: "pending",
      };

      // UPDATED: Full URL use kiya taaki nevolt-backend tak request pahunche
      const res = await fetch("https://nevolt-backend.onrender.com/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "Order failed");

      if (paymentType === "cash") {
        setIsWaiting(true);
      } else if (STRIPE_PUBLIC_KEY.startsWith("pk_test_") && STRIPE_PUBLIC_KEY !== "pk_test_dummy") {
        const sessionRes = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart, total: getTotalPrice() }),
        });
        const sessionData = await sessionRes.json();
        
        if (sessionData.sessionId) {
          const stripe = await getStripe();
          await stripe?.redirectToCheckout({ sessionId: sessionData.sessionId });
        }
      } else {
        setShowDemoPayment(true);
      }
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
            <Button className="w-full" onClick={() => { toast.success("Payment Successful!"); clearCart(); onSuccess(); onClose(); }}>Pay Now</Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowDemoPayment(false)}>Back</Button>
          </div>
        ) : isWaiting ? (
          <div className="text-center py-6 space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Give cash to the owner</h2>
            <p className="text-gray-600">Complete payment within:</p>
            <div className="text-4xl font-mono font-bold text-black">{timer}s</div>
            <p className="text-sm text-gray-500">Wait for owner to confirm order</p>
          </div>
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
