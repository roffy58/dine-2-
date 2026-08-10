import { useLocation } from "wouter";
import { menu, MenuItem } from "../data/menu";
import { useSearch } from "../contexts/SearchContext";
import { searchAllCategories } from "../utils/searchUtils";
import { useCart } from "../contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CheckCircleIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/solid";
import {
  SparklesIcon,
  CakeIcon,
  CubeIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Sabji: SparklesIcon,
  Roti: CubeIcon,
  Beverages: BeakerIcon,
  Desserts: CakeIcon,
};

const categoryBackgrounds: Record<string, string> = {
  Sabji: "indian_sabji_vegetab_c9cefded.jpg",
  Roti: "indian_roti_flatbrea_78274e9b.jpg",
  Beverages: "lassi_indian_yogurt__8d3145ee.jpg",
  Desserts: "ice_cream_dessert_bo_8c99ba01.jpg",
};

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { searchQuery, selectedCategory } = useSearch();
  const { cart, addToCart, updateQuantity } = useCart();

  const searchedMenu = searchAllCategories(menu, searchQuery);
  const filteredMenu = selectedCategory
    ? { [selectedCategory]: searchedMenu[selectedCategory] || [] }
    : searchedMenu;
  const hasSearchResults = Object.keys(filteredMenu).length > 0;
  const isSearching = searchQuery.trim().length > 0;

  const getItemQuantity = (itemId: string) => {
    return cart.find((item) => item.id === itemId)?.quantity || 0;
  };

  const renderMenuItem = (item: MenuItem) => {
    const quantity = getItemQuantity(item.id);
    const isSelected = quantity > 0;

    const getImagePath = (imageName?: string) => {
      if (!imageName) return null;
      try {
        return new URL(`../../../attached_assets/stock_images/${imageName}`, import.meta.url).href;
      } catch {
        return null;
      }
    };

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
            {/* Dish name ko theme ke hisaab se hi chhoda hai */}
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
  };

  if (isSearching) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="mb-6 space-y-4">
            <div>
              {/* ⚡ Search Results heading ko white kiya */}
              <h2 className="text-2xl md:text-3xl font-bold font-serif text-white mb-2">
                Search Results
              </h2>
              {/* ⚡ Search results count text ko white kiya */}
              <p className="text-white/90 text-sm md:text-base">
                {hasSearchResults
                  ? `Found items in ${Object.keys(filteredMenu).length} ${selectedCategory ? 'category' : 'categories'}`
                  : "No items found matching your search"}
              </p>
            </div>
            <CategoryFilter />
          </div>

          {hasSearchResults ? (
            <div className="space-y-8 pb-24">
              {Object.entries(filteredMenu).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    {/* ⚡ Category titles in search view ko white kiya */}
                    <h3 className="text-xl md:text-2xl font-semibold font-serif text-white">
                      {category}
                    </h3>
                    <Badge variant="secondary" data-testid={`badge-${category.toLowerCase()}`}>
                      {items.length} items
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {items.map(renderMenuItem)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12" data-testid="no-results">
              {/* ⚡ No results text ko white kiya */}
              <p className="text-white">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border">
          {/* ⚡ Main "Our Menu" heading ko white kiya */}
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-white mb-3 drop-shadow-sm">
            Our Menu
          </h2>
          {/* ⚡ Subtitle text ko white kiya */}
          <p className="text-white/90 text-base md:text-lg font-medium">
            Select a category to explore our delicious offerings
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24">
          {Object.keys(menu).map((category) => {
            const Icon = categoryIcons[category] || SparklesIcon;
            const itemCount = menu[category].length;
            const backgroundImage = categoryBackgrounds[category];
            const getImagePath = (imageName?: string) => {
              if (!imageName) return null;
              try {
                return new URL(`../../../attached_assets/stock_images/${imageName}`, import.meta.url).href;
              } catch {
                return null;
              }
            };

            return (
              <button
                key={category}
                onClick={() => setLocation(`/category/${category}`)}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                data-testid={`category-${category.toLowerCase()}`}
              >
                <img 
                  src={getImagePath(backgroundImage) || ''} 
                  alt={category}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30 group-hover:from-black/60 group-hover:via-black/30 group-hover:to-black/20 transition-all"></div>

                <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,1)] tracking-wide">
                    {category}
                  </h3>

                  <span className="text-base md:text-lg text-white font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,1)] bg-black/30 px-4 py-1 rounded-full backdrop-blur-sm">
                    {itemCount} items
                  </span>
                </div>

                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-black px-3 py-1 rounded-full shadow-lg">
                  <span className="text-sm font-bold">
                    {itemCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
