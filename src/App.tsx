import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth providers
import { AuthProvider } from '@features/auth/AuthContext';
import { AdminProvider } from '@shared/context/AdminContext';
import { PremiumProvider } from '@shared/context/PremiumContext';

// Secure components
import ProtectedRoute from '@features/auth/components/ProtectedRoute';
import SecureMiddleware from '@features/auth/components/SecureMiddleware';

// Page components
import Battle from '@features/arena/pages/Battle';

// Analytics integration
import * as amplitude from '@amplitude/analytics-browser';

function App() {
  // Initialize analytics
  useEffect(() => {
    const amplitudeApiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
    const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
    
    if (amplitudeApiKey && enableAnalytics) {
      amplitude.init(amplitudeApiKey, {
        defaultTracking: {
          sessions: true,
          pageViews: true,
          formInteractions: true,
          fileDownloads: true
        }
      });
      console.log('Analytics initialized');
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AdminProvider>
          <PremiumProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<div>Home Page</div>} />
              <Route path="/login" element={<div>Login Page</div>} />
              <Route path="/signup" element={<div>Signup Page</div>} />
              
              {/* Battle routes with security */}
              <Route 
                path="/battle/:lobbyCode" 
                element={
                  <ProtectedRoute>
                    <Battle />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/find-match" 
                element={
                  <ProtectedRoute>
                    <div>Find Match Page</div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Premium routes */}
              <Route 
                path="/premium/*" 
                element={
                  <ProtectedRoute requirePremium>
                    <SecureMiddleware requirePremium>
                      <div>Premium Features</div>
                    </SecureMiddleware>
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute requireAdmin>
                    <SecureMiddleware requireAdmin>
                      <div>Admin Dashboard</div>
                    </SecureMiddleware>
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PremiumProvider>
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
