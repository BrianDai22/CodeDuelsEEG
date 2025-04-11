import React from 'react';

// Restore all imports
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@ui/feedback/tooltip";
import { Toaster } from "@ui/feedback/toaster";
import { Toaster as Sonner } from "@ui/feedback/sonner";

// Feature imports
import { Login, Signup, ForgotPassword, ProtectedRoute } from "@features/auth";
import { Battle, FindMatch, Results } from "@features/arena";
import { Leaderboard } from "@features/leaderboard";
import { MatchHistory, Settings } from "@features/profile";
import { PremiumDashboard, PremiumFeatures, PremiumSuccess, PremiumRedirect } from "@features/premium";

// Shared imports
import { AuthProvider } from "@features/auth/AuthContext";
import { AnalyticsProvider } from "@shared/components/AnalyticsProvider";
import { AdminProvider } from "@shared/context/AdminContext";
import Index from "@pages/Index";
import NotFound from "@pages/NotFound";

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
