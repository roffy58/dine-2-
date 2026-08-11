import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type PendingOrder = {
  table_no?: string;
  customer_name?: string;
  items?: Array<{ id?: string; name?: string; price?: number; quantity?: number }>;
  total?: number | string;
  notes?: string;
  timestamp?: number;
};

export function OrderSuccessHandler({ onSuccessOpen }: { onSuccessOpen: () => void }) {
  const calledOnceRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (calledOnceRef.current) return;

    const url = new URL(window.location.href);
    const paymentParam = url.searchParams.get("payment");
    if (paymentParam !== "success") return;

    calledOnceRef.current = true;

    const raw = localStorage.getItem("pending_order");
    if (!raw) {
      console.warn("No pending_order in localStorage");
      return;
    }

    let pending: PendingOrder | null = null;
    try {
      pending = JSON.parse(raw);
    } catch (err) {
      console.error("Invalid pending_order JSON", err);
      localStorage.removeItem("pending_order");
      return;
    }

    const hasValidItems = Array.isArray(pending.items) && pending.items.length > 0;
    const totalValue = typeof pending.total === "number" ? pending.total : Number(pending.total);
    const totalValid = !Number.isNaN(totalValue) && totalValue > 0;

    if (!hasValidItems || !totalValid) {
      console.warn("pending_order is empty/invalid", pending);
      localStorage.removeItem("pending_order");
      return;
    }

    (async () => {
      setIsProcessing(true);
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pending, total: totalValue }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to create order on return");
        }

        onSuccessOpen();

        localStorage.removeItem("pending_order");
      } catch (err) {
        console.error("Failed to complete pending order:", err);
        toast.error(err instanceof Error ? err.message : "Failed to create order after payment");
      } finally {
        setIsProcessing(false);
      }
    })();
  }, [onSuccessOpen]);

  return null;
}
