import { RESTAURANT_NAME, LOGO_URL } from "../config";
import { ShoppingBagIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCart } from "../contexts/CartContext";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function Header() {
  const { cart, getTotalItems, removeFromCart } = useCart();
  const itemCount = getTotalItems();

  return (
    <header className="sticky top-0 z-40 bg-card shadow-md border-b-2 border-primary/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {LOGO_URL && <img src={LOGO_URL} alt={RESTAURANT_NAME} className="h-10 w-auto" />}
            <h1 className="text-xl font-bold font-serif text-foreground">{RESTAURANT_NAME}</h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <Sheet>
              <SheetTrigger asChild>
                <button className="relative p-2 bg-primary/10 rounded-full">
                  <ShoppingBagIcon className="h-6 w-6 text-primary" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
                <SheetHeader className="p-4 border-b flex flex-row justify-between items-center bg-muted/20">
                  <SheetTitle className="text-lg font-bold">Your Selection</SheetTitle>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon"><XMarkIcon className="h-6 w-6" /></Button>
                  </SheetClose>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground mt-10">Your cart is empty!</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-card p-3 rounded-lg border shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{item.quantity} x ₹{item.price}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                          <TrashIcon className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <SearchBar />
      </div>
    </header>
  );
}
