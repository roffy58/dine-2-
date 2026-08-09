import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface SuccessScreenProps {
  isOpen: boolean;
  onClose: () => void;
  orderData?: {
    id: string;
    tableNo?: string;
    table_no?: string;
    customerName?: string;
    customer_name?: string;
    placed_at?: string;
    items: OrderItem[];
    total: number;
    payment_status?: string;
  };
  restaurantName?: string;
}

export function SuccessScreen({ 
  isOpen, 
  onClose, 
  orderData, 
  restaurantName = "Nevolt Restaurant" 
}: SuccessScreenProps) {
  const [showReceipt, setShowReceipt] = useState(false);

  if (!isOpen) return null;

  const subtotal = orderData?.items 
    ? orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0) 
    : orderData?.total || 0;
  
  const tax = subtotal * 0.05; // 5% Tax calculation
  const grandTotal = subtotal + tax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Success Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

        <Card className="relative max-w-md w-full p-8 animate-in zoom-in-95 fade-in duration-500 shadow-2xl">
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

            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              {orderData && (
                <Button
                  onClick={() => setShowReceipt(true)}
                  variant="outline"
                  size="lg"
                  className="w-full border-primary text-primary hover:bg-primary/10 font-semibold"
                >
                  📄 View & Download Bill / Receipt
                </Button>
              )}

              <Button
                onClick={onClose}
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

      {/* Receipt Modal (Opens when customer clicks View Bill) */}
      {showReceipt && orderData && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Order Tax Invoice</h2>
              <button 
                onClick={() => setShowReceipt(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Receipt Body */}
            <div className="overflow-y-auto py-4 space-y-4 text-sm text-gray-700">
              
              {/* Restaurant Branding */}
              <div className="text-center space-y-1">
                <h1 className="text-xl font-extrabold text-gray-900 tracking-wide">{restaurantName}</h1>
                <p className="text-xs text-gray-500">Official Customer Bill</p>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Order ID:</span>
                  <span className="font-bold text-gray-900">#{orderData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Table No:</span>
                  <span className="font-bold text-gray-900">{orderData.tableNo || orderData.table_no || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Customer Name:</span>
                  <span className="font-bold text-gray-900">{orderData.customerName || orderData.customer_name || "Guest"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Date & Time:</span>
                  <span className="font-bold text-gray-900">
                    {orderData.placed_at ? new Date(orderData.placed_at).toLocaleString() : new Date().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-b border-dashed border-gray-300 py-3">
                <div className="grid grid-cols-12 text-xs font-bold text-gray-500 uppercase pb-2">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Price</span>
                </div>
                <div className="space-y-2 mt-1">
                  {orderData.items && orderData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 text-xs items-center">
                      <span className="col-span-6 font-medium text-gray-800 truncate">{item.name}</span>
                      <span className="col-span-2 text-center text-gray-600">x{item.quantity}</span>
                      <span className="col-span-4 text-right font-semibold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST / Tax (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t">
                  <span>Grand Total</span>
                  <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Status */}
              <div className="text-center pt-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Status: {orderData.payment_status || "Paid / Pending"}
                </span>
              </div>

            </div>

            {/* Modal Footers / Actions */}
            <div className="pt-4 border-t flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowReceipt(false)}
                className="w-1/2 rounded-xl"
              >
                Close
              </Button>
              <Button 
                onClick={handlePrint}
                className="w-1/2 rounded-xl font-medium shadow-md"
              >
                📥 Download / Print
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
