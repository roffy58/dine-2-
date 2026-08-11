import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster as HotToaster } from "react-hot-toast";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SearchProvider } from "./contexts/SearchContext";
import { Header } from "./components/Header";
import { FloatingOrderButton } from "./components/FloatingOrderButton";
import { OrderModal } from "./components/OrderModal";
import { BackgroundSlideshow } from "./components/BackgroundSlideshow";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/category/:category" component={CategoryPage} />
      <Route component={HomePage} />
    </Switch>
  );
}

function App() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SearchProvider>
          <CartProvider>
            <div className="min-h-screen bg-background relative">
              <BackgroundSlideshow />
              <Header />
              <main>
                <Router />
              </main>
              <FloatingOrderButton onClick={() => setIsOrderModalOpen(true)} />
              <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onSuccess={() => {
                  // Order success hone par bas modal close kar do, success screen modal khud sambhal lega
                  setIsOrderModalOpen(false);
                }}
              />
            </div>
            <HotToaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  fontSize: "0.875rem",
                  maxWidth: "28rem",
                },
              }}
            />
          </CartProvider>
        </SearchProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
