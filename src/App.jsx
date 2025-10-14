import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "sonner";
import { Toaster } from "@/components/ui/toaster";

import Authors from "./pages/Authors";
import PublishWithUs from "./pages/PublishWithUs";
import Contact from "./pages/Contact";
import DetailsPage from "./pages/DetailsPage";
import NotFound from "./pages/NotFound";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Index from "@/pages/Index";

// ✅ Create queryClient
const queryClient = new QueryClient();

function App() {
  // ✅ console.log outside JSX
  console.log(Header, Footer, Toaster, Sonner, TooltipProvider);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/latest-releases" element={<Index />} />
                <Route path="/books" element={<Index />} />
                <Route path="/authors" element={<Authors />} />
                <Route path="/publish" element={<PublishWithUs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/book/:id" element={<DetailsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
