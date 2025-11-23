import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

// Initialize cart from localStorage if available
const getInitialCart = () => {
  const savedCart = localStorage.getItem('bookstore_cart');
  return savedCart ? JSON.parse(savedCart) : { items: [], total: 0 };
};

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

// ✅ Create queryClient
const queryClient = new QueryClient();

function App() {
  // ✅ console.log outside JSX
  console.log(Header, Footer, Toaster, Sonner, TooltipProvider);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
