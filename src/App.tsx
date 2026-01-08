import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UsageProvider } from "@/contexts/UsageContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { JobProgressProvider } from "@/contexts/JobProgressContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import DigitalTrailmap from "./pages/DigitalTrailmap";
import PreSalesSummary from "./pages/PreSalesSummary";
import MeetingActions from "./pages/MeetingActions";
import MeetingMinutesDetail from "./pages/MeetingMinutesDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <UsageProvider>
          <JobProgressProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/digital-trailmap" element={<DigitalTrailmap />} />
                  <Route path="/presales-summary" element={<PreSalesSummary />} />
                  <Route path="/meeting-actions" element={<MeetingActions />} />
                  <Route path="/meeting-actions/:id" element={<MeetingMinutesDetail />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </JobProgressProvider>
        </UsageProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
