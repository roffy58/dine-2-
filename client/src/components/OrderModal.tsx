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
import { SuccessScreen } from "./SuccessScreen";

const STRIPE_PUBLIC_KEY = "pk_test_51U18Cy4FIpQmXqDsaMjQGP4nmoHEL3zLqZgj0GlGSbXj2HjkpgkrbCcTGHrmh70p0XLSxUDtW1xjHexKH0fzwHlQ00HCj7cjee";
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
  const [pendingFormData, setPendingFormData] = useState<OrderFormData | null>(null);
  const [successBillData, setSuccessBillData] = useState<any>(null);

  // ⚡ Stripe redirect success handler (Component mount hote hi check karega aur modal khol dega)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentStatus = queryParams.get("payment");

    if (paymentStatus === "success") {
      const rawPending = localStorage.getItem("pending_order");
      if (rawPending) {
        const pendingOrder = JSON.parse(rawPending);
        
        setSuccessBillData({
          customerName: pendingOrder.customer_name,
          tableNumber: pendingOrder.table_no,
          items: pendingOrder.items,
          total: pendingOrder.total,
          paymentType: "card"
        });

        fetch(`${BACKEND_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pendingOrder),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error("Failed to save order");
            return res.json();
          })
          .then(() => {
            toast.success("Payment Successful & Order Placed!");
            clearCart();
            localStorage.removeItem("pending_order"); // Purana pending order turant clear kar diya
            setOrderSuccess(true); // Success screen turant trigger hogi
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            console.error("Save order error:", err);
            toast.error("Payment was successful, but failed to save order on server!");
          });
      }
    }
  }, [clearCart]);

  // Timer countdown
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

  // Polling for cash confirmation
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    if (isWaiting && !orderSuccess && currentOrderId) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/orders?restaurant_id=${RESTAURANT_ID}`);
          if (res.ok) {
            const data = await res.json();
            const ordersList = Array.isArray(data) ? data : data.orders || [];

            const thisOrder = ordersList.find((o: any) => {
              const isIdMatch = String(o.id || "").trim() === String(currentOrderId).trim();
              const isOwnerConfirmedCash = (
                o.payment_status === "cash_received" || 
                o.paymentStatus === "cash_received" || 
                o.paymentMethod === "cash_received" ||
                o.paymentType === "cash_received"
              );
              return isIdMatch && isOwnerConfirmedCash;
            });

            if (thisOrder) {
              const rawPending = localStorage.getItem("pending_order");
              if (rawPending) {
                const parsed = JSON.parse(rawPending);
                setSuccessBillData({
                  customerName: parsed.customer_name,
                  tableNumber: parsed.table_no,
                  items: parsed.items,
                  total: parsed.total,
                  paymentType: "cash"
                });
              }

              setOrderSuccess(true);
              setIsWaiting(false);
              clearCart();
              localStorage.removeItem("pending_order"); // Clean up
              toast.success("Cash payment verified by owner!");
            }
          }
        } catch (err) {
          console.error("Polling fetch error:", err);
        }
      }, 1500);
    }
    return () => clearInterval(pollInterval);
  }, [isWaiting, orderSuccess, clearCart, currentOrderId]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { tableNumber: "", customerName: "", notes: "" },
  });

  const onSubmit = async (data: OrderFormData) => {
    if (!paymentType) { toast.error("Select a payment method!"); return; }

    const generatedId = Date.now().toString();
    setPendingFormData(data);

    const orderPayload = {
      id: generatedId,
      restaurant_id: RESTAURANT_ID,
      table_no: String(data.tableNumber),
      customer_name: String(data.customerName),
      items: cart,
      total: getTotalPrice().toString(),
      notes: `Payment: ${paymentType.toUpperCase()} | ${data.notes || ""}`,
      payment_status: paymentType === "cash" ? "cash_pending" : "cash_received",
      paymentType: paymentType === "cash" ? "cash" : "cash_received",
      paymentStatus: paymentType === "cash" ? "cash_pending" : "cash_received",
      status: "pending",
    };

    localStorage.setItem("pending_order", JSON.stringify(orderPayload));

    if (paymentType === "cash") {
      try {
        const res = await fetch(`${BACKEND_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });

        if (!res.ok) throw new Error("Order failed");

        const savedOrder = await res.json();
        setCurrentOrderId(savedOrder?.id || generatedId);
        setIsWaiting(true);
        setTimer(60);
      } catch (e) {
        toast.error("Something went wrong placing cash order");
      }
    } else {
      setCurrentOrderId(generatedId);
      try {
        const sessionRes = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart,
            total: getTotalPrice(),
            orderId: generatedId,
            tableNo: data.tableNumber,
            customerName: data.customerName,
            restaurant_id: RESTAURANT_ID
          }),
        });

        const sessionData = await sessionRes.json();

        if (sessionData.url) {
          window.location.href = sessionData.url;
        } else if (sessionData.sessionId) {
          const stripe = await getStripe();
          await stripe?.redirectToCheckout({ sessionId: sessionData.sessionId });
        } else {
          setShowDemoPayment(true);
        }
      } catch (err) {
        console.error("Stripe session error:", err);
        setShowDemoPayment(true);
      }
    }
  };

  const handleDemoCardPaymentSuccess = async () => {
    const rawPending = localStorage.getItem("pending_order");
    if (!rawPending) return;
    const pendingOrder = JSON.parse(rawPending);

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingOrder),
      });

      if (!res.ok) throw new Error("Failed to save card order");

      setSuccessBillData({
        customerName: pendingOrder.customer_name,
        tableNumber: pendingOrder.table_no,
        items: pendingOrder.items,
        total: pendingOrder.total,
        paymentType: "card"
      });

      setOrderSuccess(true);
      setShowDemoPayment(false);
      clearCart();
      localStorage.removeItem("pending_order"); // Clean up
      toast.success("Payment Successful & Order Placed!");
    } catch (e) {
      toast.error("Payment successful but failed to place order on server");
    }
  };

  // ⚡ Agar stripe payment successful ho gaya hai, toh chahe parent se isOpen false bhi ho, modal ko force open rakhna hai taaki bill dikh sake
  const queryParams = new URLSearchParams(window.location.search);
  const isStripeRedirectSuccess = queryParams.get("payment") === "success";

  if (!isOpen && !orderSuccess && !isStripeRedirectSuccess) return null;

  return (
    <>
      {/* ⚡ SuccessScreen jiska z-index sabse upar hai aur orderSuccess hone par bill show karegi */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[9999]">
          <SuccessScreen 
            isOpen={orderSuccess} 
            onClose={() => { 
              setOrderSuccess(false); 
              setSuccessBillData(null); // Bill data clear kar do taaki dobara khulne par purana bill na aaye
              localStorage.removeItem("pending_order");
              onSuccess(); 
              onClose(); 
            }} 
            orderData={successBillData || {
              customerName: pendingFormData?.customerName,
              tableNumber: pendingFormData?.tableNumber,
              items: cart,
              total: getTotalPrice(),
              paymentType: paymentType || "cash"
            }}
          />
        </div>
      )}

      {/* Normal Modal form (Agar order success nahi hua hai tabhi dikhega) */}
      {!orderSuccess && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white text-black p-6 rounded-2xl w-full max-w-md shadow-2xl border">
            {showDemoPayment ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Stripe Test Payment</h2>
                <p className="text-xs text-gray-500">Enter test card details to simulate payment:</p>
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
                <Button 
                  variant="outline" 
                  className="w-full mt-2" 
                  onClick={async () => {
                    if (currentOrderId) {
                      try {
                        await fetch(`${BACKEND_URL}/api/orders/${currentOrderId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "cancelled", payment_status: "user_cancelled" }),
                        });
                      } catch (err) {
                        console.error("Manual cancel error:", err);
                      }
                    }
                    setIsWaiting(false);
                    onClose();
                  }}
                >
                  Cancel Order
                </Button>
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
      )}
    </>
  );
}
