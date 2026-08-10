import { useRoute, useLocation } from "wouter";
import { menu } from "../data/menu";
import { ArrowLeftIcon, CheckCircleIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/solid";
import { useCart } from "../contexts/CartContext";
import { useSearch } from "../contexts/SearchContext";
import { filterMenuItems } from "../utils/searchUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CategoryPage() {
  const [, params] = useRoute("/category/:category");
  const [, setLocation] = useLocation();
  const { cart, addToCart, updateQuantity } = useCart();
  const { searchQuery } = useSearch();

  const category = params?.category || "";
  const allItems = menu[category] || [];
  const items = filterMenuItems(allItems, searchQuery);

  if (!allItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Category not found text ko white kiya */}
        <p className="text-white">Category not found</p>
      </div>
    );
  }

  const getItemQuantity = (itemId: string) => {
    return cart.find((item) => item.id === itemId)?.quantity || 0;
  };

  const getImagePath = (imageName?: string) => {
    if (!imageName) return null;
    try {
      return new URL(`../../../attached_assets/stock_images/${imageName}`, import.meta.url).href;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            // Back button ko white kiya taaki background par saaf dikhe
            className="mb-4 text-white hover:bg-white/10"
            data-testid="button-back"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>

          <div className="py-4 md:py-6">
            {/* ⚡ 1. Category ka main naam (jaise 'Sabji') - Ab ye all-time white rahega aur font serif/bold ho gaya hai */}
            <h2 className="text-4xl md:text-5xl font-extrabold font-serif text-white mb-2 tracking-tight">
              {category}
            </h2>
            {/* ⚡ 2. Category ka item count subtext - Ye bhi white ho gaya hai */}
            <p className="text-sm md:text-base text-white/90">
              {searchQuery
                ? `${items.length} of ${allItems.length} items`
                : `${items.length} delicious items`}
            </p>
          </div>
        </div>

        {items.length === 0 && searchQuery ? (
          <div className="text-center py-12" data-testid="no-results">
            {/* Search empty message ko white kiya */}
            <p className="text-white">
              No items found in {category} matching "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-24">
            {items.map((item) => {
            const quantity = getItemQuantity(item.id);
            const isSelected = quantity > 0;

            return (
              <Card
                key={item.id}
                className={`overflow-hidden transition-all duration-200 ${
                  isSelected ? "ring-2 ring-primary shadow-lg scale-105" : ""
                }`}
                data-testid={`item-${item.id}`}
              >
                {item.image && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={getImagePath(item.image) || ''} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div>
                    {/* Item card ke andar ka naam (Theme ke hisaab se hi chalega kyunki cards white background ke hote hain) */}
                    <h3 className="text-lg md:text-xl font-medium text-foreground mb-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base md:text-lg font-semibold text-foreground">
                      ₹{item.price}
                    </span>

                    {!isSelected ? (
                      <Button
                        onClick={() => addToCart(item)}
                        size="sm"
                        variant="default"
                        data-testid={`button-add-${item.id}`}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-primary" />
                        <div className="flex items-center gap-1 bg-primary/10 rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.id, quantity - 1)}
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover-elevate active-elevate-2"
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-semibold text-foreground" data-testid={`quantity-${item.id}`}>
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, quantity + 1)}
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover-elevate active-elevate-2"
                            data-testid={`button-increase-${item.id}`}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
