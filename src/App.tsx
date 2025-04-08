import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PremiumRedirect from "@/components/PremiumRedirect";
import Index from "./pages/Index";
import Battle from "./pages/Battle";
import Results from "./pages/Results";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import ForgotPassword from "@/pages/ForgotPassword";
import FindMatch from "@/pages/FindMatch";
import PremiumFeatures from "@/pages/PremiumFeatures";
import PremiumSuccess from "@/pages/PremiumSuccess";
import PremiumDashboard from "@/pages/PremiumDashboard";
import Settings from "@/pages/Settings";
import MatchHistory from '@/pages/MatchHistory';
import { AdminProvider } from '@/contexts/AdminContext';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <AuthProvider>
          <AnalyticsProvider>
            <AdminProvider>
              <PremiumRedirect>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/battle" element={<Battle />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/find-match" element={
                    <ProtectedRoute>
                      <FindMatch />
                    </ProtectedRoute>
                  } />
                  <Route path="/premium" element={<PremiumFeatures />} />
                  <Route path="/premium/success" element={<PremiumSuccess />} />
                  <Route path="/premium-dashboard" element={
                    <ProtectedRoute>
                      <PremiumDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/match-history" element={
                    <ProtectedRoute>
                      <MatchHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PremiumRedirect>
            </AdminProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
