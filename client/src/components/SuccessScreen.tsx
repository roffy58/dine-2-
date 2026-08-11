import { useRef } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

interface SuccessScreenProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName?: string;
  orderData?: {
    id?: string | number;
    customerName?: string;
    tableNumber?: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    total?: string | number;
    paymentType?: string;
  };
}

export function SuccessScreen({ isOpen, onClose, restaurantName = "Nevolt", orderData }: SuccessScreenProps) {
  const billRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownloadBill = async () => {
    if (!billRef.current) return;
    try {
      const canvas = await html2canvas(billRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${restaurantName.replace(/\s+/g, "-")}-Bill.png`;
      link.click();
      toast.success("Bill downloaded successfully!");
    } catch (err) {
      console.error("Download bill error:", err);
      toast.error("Failed to download bill");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

      <Card className="relative max-w-md w-full p-6 animate-in zoom-in-95 fade-in duration-500 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-4">
          <div className="flex justify-center animate-in zoom-in duration-700 delay-100">
            <CheckCircleIcon className="h-16 w-16 text-primary" />
          </div>

          <div className="space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-success-heading">
              Order Placed Successfully!
            </h2>
            <p className="text-sm text-muted-foreground" data-testid="text-success-message">
              Your delicious food will be prepared shortly
            </p>
          </div>

          {/* 🧾 Digital Bill Box (Ref attached for clean bill-only download) */}
          <div ref={billRef} className="bg-white border border-border rounded-lg p-4 text-left text-sm space-y-2 text-foreground">
            <div className="text-center font-bold text-base border-b pb-2 mb-2">{restaurantName.toUpperCase()} - Digital Bill</div>
            
            {orderData?.id && (
              <div className="flex justify-between text-xs text-gray-500 border-b pb-1">
                <span>ID:</span> <span className="font-mono font-medium">{orderData.id}</span>
              </div>
            )}

            <div className="flex justify-between"><span>Customer:</span> <span className="font-medium">{orderData?.customerName || "Guest"}</span></div>
            <div className="flex justify-between"><span>Table No:</span> <span className="font-medium">{orderData?.tableNumber || "-"}</span></div>
            <div className="flex justify-between"><span>Payment Type:</span> <span className="font-medium uppercase">{orderData?.paymentType || "Cash"}</span></div>
            <div className="flex justify-between"><span>Time:</span> <span className="font-medium">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>

            <div className="border-t pt-2 mt-2">
              <div className="font-semibold mb-1">Dishes:</div>
              {orderData?.items && orderData.items.length > 0 ? (
                orderData.items.map((item, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs text-muted-foreground py-0.5">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">Items details not available</div>
              )}
            </div>

            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base text-foreground">
              <span>Total Price:</span>
              <span>₹{orderData?.total || "0"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <Button
              variant="outline"
              size="lg"
              className="w-1/2"
              onClick={handleDownloadBill}
            >
              Download Bill
            </Button>
            <Button
              onClick={onClose}
              size="lg"
              className="w-1/2"
              data-testid="button-back-to-menu"
            >
              Done
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
