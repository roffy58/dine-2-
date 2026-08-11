import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem } from "../types";
import { MenuItem } from "../data/menu";

interface OrderSnapshot {
  id: string;
  items: CartItem[];
  total: number;
  paymentType: string;
  customerName?: string;
  createdAt: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  // New API:
  lastOrder: OrderSnapshot | null;
  setLastOrder: (order: OrderSnapshot | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "restaurant-menu-cart";
const LAST_ORDER_STORAGE_KEY = "restaurant-last-order";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [lastOrder, setLastOrder] = useState<OrderSnapshot | null>(() => {
    const saved = localStorage.getItem(LAST_ORDER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (lastOrder) {
      localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(lastOrder));
    } else {
      localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
    }
  }, [lastOrder]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        lastOrder,
        setLastOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
