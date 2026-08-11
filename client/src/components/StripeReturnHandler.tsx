import { useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import toast from "react-hot-toast";

interface Props {
  onSuccess: () => void;
}

const BACKEND_URL = "https://nevolt-backend.onrender.com";

export function StripeReturnHandler({ onSuccess }: Props) {
  const { clearCart } = useCart();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");

    // Sirf tab chale jab URL mein payment=success ho
    if (paymentStatus !== "success") return;

    // Double execution / race condition rokne ke liye flag
    const alreadyProcessed = sessionStorage.getItem("stripe_success_processed");
    if (alreadyProcessed === "true") return;

    const postPending = async () => {
      const raw = localStorage.getItem("pending_order");
      if (!raw) {
        // Agar pending order hi nahi hai, toh fake bill mat dikhao, seedha URL clean karo
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        return;
      }

      try {
        sessionStorage.setItem("stripe_success_processed", "true");
        const pendingOrder = JSON.parse(raw);

        // Safety check: Agar pending order ke andar items ya total nahi hai toh cancel karo
        if (!pendingOrder || !pendingOrder.items || pendingOrder.items.length === 0) {
          localStorage.removeItem("pending_order");
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pendingOrder),
        });
        
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.message || "Failed to record order");

        localStorage.removeItem("pending_order");
        clearCart();
        toast.success("Payment Successful & Order Placed!");
        
        // Sab kuch sahi hone ke baad hi success trigger karo
        onSuccess();

        // URL clean karo taaki baar baar trigger na ho
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (err) {
        console.error("Failed to post pending order after Stripe return:", err);
        sessionStorage.removeItem("stripe_success_processed");
        toast.error(err instanceof Error ? err.message : "Failed to record order");
      }
    };

    postPending();
  }, [clearCart, onSuccess]);

  return null;
}
