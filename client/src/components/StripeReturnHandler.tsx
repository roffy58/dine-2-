import { useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import toast from "react-hot-toast";

interface Props {
  onSuccess: () => void;
}

export function StripeReturnHandler({ onSuccess }: Props) {
  const { clearCart } = useCart();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    const postPending = async () => {
      const raw = localStorage.getItem("pending_order");
      if (!raw) {
        // nothing to post
        return;
      }
      try {
        const pendingOrder = JSON.parse(raw);
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pendingOrder),
        });
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.message || "Failed to record order");

        localStorage.removeItem("pending_order");
        clearCart();
        onSuccess();

        // remove session_id from URL for cleanliness
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (err) {
        console.error("Failed to post pending order after Stripe return:", err);
        toast.error(err instanceof Error ? err.message : "Failed to record order");
      }
    };

    postPending();
  }, [clearCart, onSuccess]);

  return null;
}
