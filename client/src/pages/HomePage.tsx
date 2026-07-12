import { useLocation } from "wouter";
import { menu, MenuItem } from "../data/menu";
import { useSearch } from "../contexts/SearchContext";
import { searchAllCategories } from "../utils/searchUtils";
import { useCart } from "../contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryFilter } from "../components/CategoryFilter";
import { CheckCircleIcon, PlusIcon, MinusIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { CakeIcon, CubeIcon, BeakerIcon } from "@heroicons/react/24/outline";

// 1. Recommendation Logic
const getRecommendation = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return { title: "☀️ Morning Fresh", desc: "Start your day with our breakfast specials!" };
  if (hour >= 11 && hour < 16) return { title: "🍛 Lunch Special", desc: "Enjoy our signature thali, hot and fresh." };
  if (hour >= 16 && hour < 19) return { title: "☕ Evening Snacks", desc: "Perfect time for pakoras and tea." };
  return { title: "🌙 Dinner Special", desc: "Wrap up your day with our delicious dinner combos." };
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Sabji: SparklesIcon, Roti: CubeIcon, Beverages: BeakerIcon, Desserts: CakeIcon,
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
  const rec = getRecommendation();

  const searchedMenu = searchAllCategories(menu, searchQuery);
  const filteredMenu = selectedCategory ? { [selectedCategory]: searchedMenu[selectedCategory] || [] } : searchedMenu;
  const hasSearchResults = Object.keys(filteredMenu).length > 0;
  const isSearching = searchQuery.trim().length > 0;

  const getItemQuantity = (itemId: string) => cart.find((item) => item.id === itemId)?.quantity || 0;

  const getImagePath = (imageName?: string) => {
    if (!imageName) return null;
    try { return new URL(`../../../attached_assets/stock_images/${imageName}`, import.meta.url).href; }
    catch { return null; }
  };

  const renderMenuItem = (item: MenuItem) => {
    const quantity = getItemQuantity(item.id);
    const isSelected = quantity > 0;
    return (
      <Card key={item.id} className={`overflow-hidden transition-all duration-200 ${isSelected ? "ring-2 ring-primary shadow-lg scale-105" : ""}`}>
        {item.image && <div className="w-full h-48 overflow-hidden"><img src={getImagePath(item.image) || ''} alt={item.name} className="w-full h-full object-cover" /></div>}
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-medium text-foreground">{item.name}</h3>
          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold text-foreground">₹{item.price}</span>
            {!isSelected ? (
              <Button onClick={() => addToCart(item)} size="sm"><PlusIcon className="h-4 w-4 mr-1" /> Add</Button>
            ) : (
              <div className="flex items-center gap-2 bg-primary/10 rounded-full p-1">
                <button onClick={() => updateQuantity(item.id, quantity - 1)} className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><MinusIcon className="h-4 w-4" /></button>
                <span className="w-8 text-center font-bold text-foreground">{quantity}</span>
                <button onClick={() => updateQuantity(item.id, quantity + 1)} className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><PlusIcon className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (isSearching) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold font-serif mb-4">Search Results</h2>
        <CategoryFilter />
        {hasSearchResults ? Object.entries(filteredMenu).map(([cat, items]) => (
          <div key={cat} className="mt-6">
            <h3 className="text-xl font-semibold mb-4">{cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{items.map(renderMenuItem)}</div>
          </div>
        )) : <p className="text-center py-12">No items found.</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* New Stylish Banner */}
        <div className="mb-10 p-6 bg-gradient-to-r from-primary to-primary/80 rounded-3xl shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 transition-transform group-hover:scale-125">
             <SparklesIcon className="h-32 w-32" />
          </div>
          <h2 className="text-2xl font-bold font-serif mb-1">{rec.title}</h2>
          <p className="opacity-90 font-medium">{rec.desc}</p>
        </div>

        <h2 className="text-3xl font-bold font-serif mb-6 text-foreground">Explore Categories</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Object.keys(menu).map((category) => (
            <button key={category} onClick={() => setLocation(`/category/${category}`)} 
              className="group relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <img src={getImagePath(categoryBackgrounds[category]) || ''} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={category} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 w-full">
                <h3 className="text-2xl font-bold text-white mb-1">{category}</h3>
                <Badge className="bg-white/20 text-white backdrop-blur-md border-0">{menu[category].length} Items</Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
