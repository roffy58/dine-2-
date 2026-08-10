import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useSearch } from "../contexts/SearchContext";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useSearch();

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className="relative flex items-center w-full max-w-md">
      {/* ⚡ Search Icon Placement Fix */}
      <MagnifyingGlassIcon className="absolute left-3.5 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
      
      <Input
        type="text"
        placeholder="Search menu items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-10 py-2 rounded-lg bg-background text-foreground border border-input shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        data-testid="input-search"
      />

      {/* ⚡ Clear (Cross) Button & Icon Placement Fix */}
      {searchQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3.5 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground z-10 rounded-full transition-colors"
          data-testid="button-clear-search"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
