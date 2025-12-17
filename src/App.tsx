import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UsageProvider } from "@/contexts/UsageContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Home from "./pages/Home";
import DigitalTrailmap from "./pages/DigitalTrailmap";
import PreSalesSummary from "./pages/PreSalesSummary";
import MeetingActions from "./pages/MeetingActions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <UsageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/digital-trailmap" element={<DigitalTrailmap />} />
              <Route path="/presales-summary" element={<PreSalesSummary />} />
              <Route path="/meeting-actions" element={<MeetingActions />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UsageProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
