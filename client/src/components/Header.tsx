import { RESTAURANT_NAME, LOGO_URL } from "../config";
import { ShoppingBagIcon, TrashIcon } from "@heroicons/react/24/outline"; // TrashIcon add kiya
import { useCart } from "../contexts/CartContext";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function Header() {
  const { cart, getTotalItems, removeFromCart, getTotalPrice } = useCart();
  const itemCount = getTotalItems();

  return (
    <header className="sticky top-0 z-40 bg-card shadow-md border-b-2 border-primary/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {LOGO_URL && <img src={LOGO_URL} alt={RESTAURANT_NAME} className="h-10 md:h-12 w-auto" />}
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">{RESTAURANT_NAME}</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            
            <Sheet>
              <SheetTrigger asChild>
                <button className="relative cursor-pointer">
                  <ShoppingBagIcon className="h-6 w-6 text-foreground" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Your Cart ({itemCount} items)</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground">Cart is empty</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity} x ₹{item.price}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                          <TrashIcon className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                
                {cart.length > 0 && (
                  <div className="mt-8 pt-4 border-t">
                    <p className="text-xl font-bold">Total: ₹{getTotalPrice()}</p>
                    <Button className="w-full mt-4">Checkout Now</Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="w-full md:w-auto md:max-w-md">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
