import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem } from "../types";
import { MenuItem } from "../data/menu";

export type PaymentType = "card" | "cash";

interface CartContextType {
  cart: CartItem[];
  paymentType: PaymentType;
  setPaymentType: (type: PaymentType) => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  checkout: () => Promise<boolean>; 
  finalizeOrder: () => Promise<boolean>; // 🆕 Naya function
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "restaurant-menu-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [paymentType, setPaymentType] = useState<PaymentType>("cash");

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => setCart((prev) => prev.filter((item) => item.id !== itemId));

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
  };

  const clearCart = () => setCart([]);

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 1. Checkout ab sirf trigger karega (No Sheet Entry here)
  const checkout = async () => {
    return true; 
  };

  // 2. FinalizeOrder ab sheet mein data bheje ga (Sirf confirm hone par)
  const finalizeOrder = async () => {
    try {
      const orderData = {
        table_no: "Table-1",
        customer_name: "Guest",
        items: cart,
        total: getTotalPrice(),
        paymentType: paymentType,
        status: "Confirmed", // ✅ Confirmed status
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        clearCart();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Finalize Order failed", err);
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        paymentType,
        setPaymentType,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        checkout,
        finalizeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
