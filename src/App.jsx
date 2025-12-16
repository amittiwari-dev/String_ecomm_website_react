import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider, useCart } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteWrapper from "./components/RouteWrapper";

import Authors from "./pages/Authors";
import PublishWithUs from "./pages/PublishWithUs";
import Contact from "./pages/Contact";
import DetailsPage from "./pages/DetailsPage";
import NotFound from "./pages/NotFound";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageWrapper from "@/components/PageWrapper";
import Index from "@/pages/Index";
import AllBooks from "@/pages/AllBooks";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MyProfile from "./pages/MyProfile";
import OrderHistory from "./pages/OrderHistory";
import TestPage from "./pages/TestPage";

// ✅ Create queryClient with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Only retry once for mutations
        return failureCount < 1;
      },
    },
  },
});

// Global error handler for the application
const handleGlobalError = (error, errorInfo) => {
  // Log error details
  console.error('Global Error Boundary caught an error:', error, errorInfo);
  
  // Report to error monitoring service (if available)
  if (window.errorReportingService) {
    window.errorReportingService.captureException(error, {
      extra: errorInfo,
      tags: { source: 'global-error-boundary' }
    });
  }
  
  // Track error in analytics (if available)
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: true
    });
  }
};

function App() {
  console.log('App component rendering...');

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CartProvider>
            <AuthProvider>
              <BrowserRouter>
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1">
                    <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={
                      <RouteWrapper title="Home">
                        <Index />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/books" element={
                      <RouteWrapper title="All Books">
                        <AllBooks />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/latest-releases" element={
                      <RouteWrapper title="Latest Releases">
                        <AllBooks />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/authors" element={
                      <RouteWrapper title="Our Authors">
                        <Authors />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/publish" element={
                      <RouteWrapper title="Publish with Us">
                        <PublishWithUs />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/contact" element={
                      <RouteWrapper title="Contact Us">
                        <Contact />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/book/:slug" element={
                      <RouteWrapper title="Book Details">
                        <DetailsPage />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/cart" element={
                      <RouteWrapper title="Shopping Cart">
                        <Cart />
                      </RouteWrapper>
                    } />
                    
                    {/* Authentication Routes */}
                    <Route path="/login" element={
                      <RouteWrapper title="Login">
                        <Login />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/register" element={
                      <RouteWrapper title="Register">
                        <Register />
                      </RouteWrapper>
                    } />
                    
                    {/* Protected Routes */}
                    <Route path="/checkout" element={
                      <RouteWrapper title="Checkout" requiresAuth={true}>
                        <Checkout />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/order-confirmation" element={
                      <RouteWrapper title="Order Confirmation" requiresAuth={true}>
                        <OrderConfirmation />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/profile" element={
                      <RouteWrapper title="My Profile" requiresAuth={true}>
                        <MyProfile />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/orders" element={
                      <RouteWrapper title="Order History" requiresAuth={true}>
                        <OrderHistory />
                      </RouteWrapper>
                    } />
                    
                    <Route path="/order-history" element={
                      <RouteWrapper title="Order History" requiresAuth={true}>
                        <OrderHistory />
                      </RouteWrapper>
                    } />
                    
                    {/* Test Routes */}
                    <Route path="/test" element={
                      <RouteWrapper title="Test Page">
                        <TestPage />
                      </RouteWrapper>
                    } />
                    
                    {/* 404 Route */}
                    <Route path="*" element={
                      <RouteWrapper title="Page Not Found">
                        <NotFound />
                      </RouteWrapper>
                    } />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </BrowserRouter>
              <Toaster />
              <Sonner />
            </AuthProvider>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
