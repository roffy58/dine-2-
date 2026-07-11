import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderFormSchema, type OrderFormData } from "../schemas/orderSchema";
import toast from "react-hot-toast";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderModal({ isOpen, onClose, onSuccess }: OrderModalProps) {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [paymentType, setPaymentType] = useState<"card" | "cash" | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer

  // Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showTimer && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setShowTimer(false);
    }
    return () => clearInterval(timer);
  }, [showTimer, timeLeft]);

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
        total: getTotalPrice().toString(), // Changed to string for schema compatibility
        notes: data.notes || "",
        paymentType: paymentType,
        paymentStatus: paymentType === "card" ? "paid" : "pending",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      if (!res.ok) throw new Error("Failed to place order");

      if (paymentType === "cash") {
        setShowTimer(true);
      } else {
        toast.success("✅ Payment initiated!");
        clearCart();
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error("❌ Something went wrong.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="bg-card border p-6 rounded-2xl w-full max-w-md shadow-xl">
        {showTimer ? (
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-primary">
              Pay Cash: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </h2>
            <p className="mt-2 text-muted-foreground">Please pay the amount to the waiter.</p>
            <Button onClick={() => { clearCart(); onClose(); onSuccess(); }} className="w-full mt-4">Close</Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Complete Order</h2>
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
