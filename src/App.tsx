import React from 'react';

// Core dependencies
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@ui/feedback/tooltip";
import { Toaster } from "@ui/feedback/toaster";
import { Toaster as Sonner } from "@ui/feedback/sonner";

// Feature-based imports (all page components come from feature modules)
import { Login, Signup, ForgotPassword, ProtectedRoute } from "@features/auth";
import { Battle, FindMatch, Results } from "@features/arena";
import { Leaderboard } from "@features/leaderboard";
import { MatchHistory, Settings } from "@features/profile";
import { 
  PremiumDashboard, 
  PremiumFeatures, 
  PremiumSuccess, 
  PremiumRedirect,
  PremiumRouteWrapper
} from "@features/premium";

// Admin feature imports
import AdminPanel from "@features/admin/pages/AdminPanel";
import AdminDashboard from "@features/admin/pages/AdminDashboard";
import AdminLeaderboard from "@features/admin/pages/AdminLeaderboard";
import AdminSettings from "@features/admin/pages/AdminSettings";

// Standalone pages
import Index from "@pages/Index";
import NotFound from "@pages/NotFound";

// Core providers and context
import { AuthProvider } from "@features/auth/AuthContext";
import { AdminProvider } from "@shared/context/AdminContext";
import { PremiumProvider } from "@shared/context/PremiumContext";
import { AnalyticsProvider } from "@shared/components/AnalyticsProvider";
import SecureMiddleware from "@features/auth/components/SecureMiddleware";

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
              <PremiumProvider>
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
                      <SecureMiddleware requirePremium fallbackPath="/premium">
                        <PremiumDashboard />
                      </SecureMiddleware>
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
                    
                    {/* Premium versions of routes */}
                    <Route path="/premium/leaderboard" element={
                      <SecureMiddleware requirePremium fallbackPath="/premium">
                        <PremiumRouteWrapper>
                          <Leaderboard />
                        </PremiumRouteWrapper>
                      </SecureMiddleware>
                    } />
                    <Route path="/premium/find-match" element={
                      <SecureMiddleware requirePremium fallbackPath="/premium">
                        <PremiumRouteWrapper>
                          <FindMatch />
                        </PremiumRouteWrapper>
                      </SecureMiddleware>
                    } />
                    <Route path="/premium/match-history" element={
                      <SecureMiddleware requirePremium fallbackPath="/premium">
                        <PremiumRouteWrapper>
                          <MatchHistory />
                        </PremiumRouteWrapper>
                      </SecureMiddleware>
                    } />
                    <Route path="/premium/settings" element={
                      <SecureMiddleware requirePremium fallbackPath="/premium">
                        <PremiumRouteWrapper>
                          <Settings />
                        </PremiumRouteWrapper>
                      </SecureMiddleware>
                    } />
                    <Route path="/premium/battle" element={
                      <SecureMiddleware requirePremium fallbackPath="/premium">
                        <PremiumRouteWrapper>
                          <Battle />
                        </PremiumRouteWrapper>
                      </SecureMiddleware>
                    } />
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={
                      <SecureMiddleware requireAdmin fallbackPath="/">
                        <AdminPanel />
                      </SecureMiddleware>
                    } />
                    <Route path="/admin/users" element={
                      <SecureMiddleware requireAdmin fallbackPath="/">
                        <AdminPanel />
                      </SecureMiddleware>
                    } />
                    <Route path="/admin/dashboard" element={
                      <SecureMiddleware requireAdmin fallbackPath="/">
                        <AdminDashboard />
                      </SecureMiddleware>
                    } />
                    <Route path="/admin/leaderboard" element={
                      <SecureMiddleware requireAdmin fallbackPath="/">
                        <AdminLeaderboard />
                      </SecureMiddleware>
                    } />
                    <Route path="/admin/settings" element={
                      <SecureMiddleware requireAdmin fallbackPath="/">
                        <AdminSettings />
                      </SecureMiddleware>
                    } />
                    <Route path="/admin/statistics" element={
                      <SecureMiddleware requireAdmin fallbackPath="/">
                        <AdminDashboard />
                      </SecureMiddleware>
                    } />
                    <Route path="/admin/database" element={
                      <SecureMiddleware requireAdmin fallbackPath="/">
                        <AdminPanel />
                      </SecureMiddleware>
                    } />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PremiumRedirect>
              </PremiumProvider>
            </AdminProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
