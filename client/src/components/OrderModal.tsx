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
const BACKEND_URL = "https://nevolt-backend.onrender.com";
const RESTAURANT_ID = "res-1";
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
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showDemoPayment, setShowDemoPayment] = useState(false);
  
  // Form data temporarily hold karne ke liye jab tak card payment complete na ho
  const [pendingFormData, setPendingFormData] = useState<OrderFormData | null>(null);

  // 1-minute countdown timer & timeout handler (Cash Timeout)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWaiting && !orderSuccess && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (isWaiting && !orderSuccess && timer === 0) {
      setIsWaiting(false);
      toast.error("Payment Timed Out! Order cancelled.");
      
      if (currentOrderId) {
        fetch(`${BACKEND_URL}/api/orders/${currentOrderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled", payment_status: "expired" }),
        }).catch(err => console.error("Cancel timeout error:", err));
      }

      onClose();
    }
    return () => clearInterval(interval);
  }, [isWaiting, timer, orderSuccess, currentOrderId, onClose]);

  // Real-time polling to check if owner confirmed the cash payment
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    if (isWaiting && currentOrderId && !orderSuccess) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/orders?restaurant_id=${RESTAURANT_ID}`);
          if (res.ok) {
            const data = await res.json();
            const ordersList = Array.isArray(data) ? data : data.orders || [];
            const thisOrder = ordersList.find((o: any) => String(o.id) === String(currentOrderId));
            
            if (
              thisOrder && 
              (thisOrder.payment_status === "cash_received" || thisOrder.paymentMethod === "cash_received")
            ) {
              setOrderSuccess(true);
              setIsWaiting(false);
              clearCart();
              toast.success("Cash payment verified by owner!");
            }
          }
        } catch (err) {
          console.error("Polling fetch error:", err);
        }
      }, 2000);
    }
    return () => clearInterval(pollInterval);
  }, [isWaiting, currentOrderId, orderSuccess, clearCart]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { tableNumber: "", customerName: "", notes: "" },
  });

  const onSubmit = async (data: OrderFormData) => {
    if (!paymentType) { toast.error("Select a payment method!"); return; }

    const generatedId = Date.now().toString();
    setCurrentOrderId(generatedId);

    if (paymentType === "cash") {
      // Cash ke case mein order turant dashboard par "cash_pending" status ke sath jayega
      try {
        const newOrder = {
          id: generatedId,
          restaurant_id: RESTAURANT_ID,
          table_no: String(data.tableNumber),
          customer_name: String(data.customerName),
          items: cart,
          total: getTotalPrice().toString(),
          notes: `Payment: CASH | ${data.notes || ""}`,
          payment_status: "cash_pending",
          paymentType: "cash",
          paymentStatus: "pending",
          status: "pending",
        };

        const res = await fetch(`${BACKEND_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newOrder),
        });

        if (!res.ok) throw new Error("Order failed");

        setIsWaiting(true);
        setTimer(60);
      } catch (e) {
        toast.error("Something went wrong placing cash order");
      }
    } else {
      // 👈 CARD PAYMENT FLOW: Order tab tak dashboard par nahi jayega jab tak payment successful na ho
      setPendingFormData(data);

      const hasRealStripeKey = STRIPE_PUBLIC_KEY && 
                               STRIPE_PUBLIC_KEY !== "pk_test_dummy" && 
                               STRIPE_PUBLIC_KEY.startsWith("pk_");

      if (hasRealStripeKey) {
        try {
          const sessionRes = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              items: cart, 
              total: getTotalPrice(),
              orderId: generatedId,
              tableNo: data.tableNumber,
              customerName: data.customerName 
            }),
          });
          const sessionData = await sessionRes.json();

          if (sessionData.sessionId) {
            const stripe = await getStripe();
            await stripe?.redirectToCheckout({ sessionId: sessionData.sessionId });
          } else {
            setShowDemoPayment(true);
          }
        } catch (err) {
          setShowDemoPayment(true);
        }
      } else {
        // Agar real stripe keys nahi hain, toh demo card payment window khulegi
        setShowDemoPayment(true);
      }
    }
  };

  // Helper function to submit card order to backend AFTER successful demo payment
  const handleDemoCardPaymentSuccess = async () => {
    if (!pendingFormData) return;
    try {
      const newOrder = {
        id: currentOrderId,
        restaurant_id: RESTAURANT_ID,
        table_no: String(pendingFormData.tableNumber),
        customer_name: String(pendingFormData.customerName),
        items: cart,
        total: getTotalPrice().toString(),
        notes: `Payment: CARD (Paid) | ${pendingFormData.notes || ""}`,
        payment_status: "paid",
        paymentType: "card",
        paymentStatus: "paid",
        status: "pending",
      };

      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      if (!res.ok) throw new Error("Failed to save card order");

      setOrderSuccess(true);
      setShowDemoPayment(false);
      clearCart();
      toast.success("Payment Successful & Order Placed!");
    } catch (e) {
      toast.error("Payment successful but failed to place order on server");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white text-black p-6 rounded-2xl w-full max-w-md shadow-2xl border">
        {orderSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
            <h2 className="text-2xl font-bold text-green-600">Your order successfully placed!</h2>
            <p className="text-gray-600">Payment verified. Enjoy your meal!</p>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => { setOrderSuccess(false); onSuccess(); onClose(); }}>Done</Button>
          </div>
        ) : showDemoPayment ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Demo Card Payment</h2>
            <p className="text-xs text-gray-500">Stripe live keys not found. Enter test card details to simulate payment:</p>
            <Input placeholder="Card Number (4242 4242...)" />
            <div className="flex gap-2"> <Input placeholder="MM/YY" /> <Input placeholder="CVC" /> </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleDemoCardPaymentSuccess}>
              Pay ₹{getTotalPrice()} & Confirm Order
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowDemoPayment(false)}>Back</Button>
          </div>
        ) : isWaiting ? (
          <div className="text-center py-6 space-y-4">
            <h2 className="text-2xl font-bold text-amber-600">Give cash to the owner</h2>
            <p className="text-gray-600">Complete payment within:</p>
            <div className="text-4xl font-mono font-bold text-black">{timer}s</div>
            <p className="text-sm text-gray-500 animate-pulse">Waiting for owner to confirm cash...</p>
            <Button variant="outline" className="w-full mt-2" onClick={() => {
              setIsWaiting(false);
              onClose();
            }}>Cancel Order</Button>
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
              <Button type="submit" className="w-full">Proceed to Pay</Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
