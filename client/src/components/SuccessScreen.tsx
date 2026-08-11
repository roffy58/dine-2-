import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SuccessScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuccessScreen({ isOpen, onClose }: SuccessScreenProps) {
  const ranRef = useRef(false);
  const [allowedToShow, setAllowedToShow] = useState<boolean | null>(null);
  // null = not yet decided, true = show, false = block & close

  useEffect(() => {
    if (!isOpen) {
      setAllowedToShow(null);
      ranRef.current = false;
      return;
    }

    // Only evaluate once per open (defense for StrictMode double-mount)
    if (ranRef.current) return;
    ranRef.current = true;

    // If this open was due to a Stripe return (payment=success), require valid pending_order
    let mustValidate = false;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("payment") === "success") mustValidate = true;
    } catch {
      // ignore URL parse failures and default to not forcing validation
    }

    if (!mustValidate) {
      // Not a Stripe return — allow (this preserves demo/cash flows)
      setAllowedToShow(true);
      return;
    }

    // Stripe return: validate pending_order in localStorage
    const raw = localStorage.getItem("pending_order");
    if (!raw) {
      // no pending order -> block
      setAllowedToShow(false);
      // close after a tick so parent state updates cleanly
      setTimeout(() => onClose(), 0);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn("pending_order JSON invalid, clearing and blocking success screen", err);
      localStorage.removeItem("pending_order");
      setAllowedToShow(false);
      setTimeout(() => onClose(), 0);
      return;
    }

    const hasValidItems = Array.isArray(parsed.items) && parsed.items.length > 0;
    const totalVal = typeof parsed.total === "number" ? parsed.total : Number(parsed.total);
    const totalValid = !Number.isNaN(totalVal) && totalVal > 0;

    if (!hasValidItems || !totalValid) {
      // invalid/stale pending order -> remove and block render
      localStorage.removeItem("pending_order");
      setAllowedToShow(false);
      setTimeout(() => onClose(), 0);
      return;
    }

    // Passed validation -> allow showing the success UI
    setAllowedToShow(true);
  }, [isOpen, onClose]);

  // If we haven't decided yet, render nothing (avoids flicker)
  if (!isOpen) return null;
  if (allowedToShow === null) return null;
  if (allowedToShow === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      
      <Card className="relative max-w-md w-full p-8 animate-in zoom-in-95 fade-in duration-500">
        <div className="text-center space-y-6">
          <div className="flex justify-center animate-in zoom-in duration-700 delay-100">
            <CheckCircleIcon className="h-24 w-24 text-primary" />
          </div>

          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <h2 className="text-3xl font-bold text-foreground" data-testid="text-success-heading">
              Order Placed Successfully!
            </h2>
            <p className="text-muted-foreground" data-testid="text-success-message">
              Your delicious food will be prepared shortly
            </p>
          </div>

          <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <Button
              onClick={() => {
                localStorage.removeItem("pending_order"); // optional cleanup
                onClose();
              }}
              size="lg"
              className="w-full"
              data-testid="button-back-to-menu"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}