import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider, useCart } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import Authors from "./pages/Authors";
import PublishWithUs from "./pages/PublishWithUs";
import Contact from "./pages/Contact";
import DetailsPage from "./pages/DetailsPage";
import NotFound from "./pages/NotFound";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Index from "@/pages/Index";
import NewBooks from "@/pages/AllBooks";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/MyProfile";
import OrderHistory from "./pages/OrderHistory";

// ✅ Create queryClient
const queryClient = new QueryClient();

// Wrapper component to connect AuthProvider with CartContext
function AuthWithCartSync({ children }) {
  const { syncCart } = useCart();
  
  return (
    <AuthProvider onCartSync={syncCart}>
      {children}
    </AuthProvider>
  );
}

function App() {
  // ✅ console.log outside JSX
  console.log(Header, Footer, Toaster, Sonner, TooltipProvider);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <AuthWithCartSync>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/latest-releases" element={<NewBooks />} />
                    <Route path="/books" element={<Index />} />
                    <Route path="/authors" element={<Authors />} />
                    <Route path="/publish" element={<PublishWithUs />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/book/:idSlug" element={<DetailsPage />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation" element={<OrderConfirmation />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/orders" element={<OrderHistory />} />
                    <Route path="*" element={<NotFound />} />

                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </AuthWithCartSync>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
