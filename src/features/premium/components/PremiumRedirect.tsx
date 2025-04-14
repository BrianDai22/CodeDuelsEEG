import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Loader2 } from 'lucide-react';

const PremiumRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine premium status directly from user context
  const isPremium = user?.isPremium || false;

  useEffect(() => {
    // Only redirect after both auth and admin contexts have loaded
    if (authLoading || adminLoading) return;
    
    // If user is on root path
    if (location.pathname === '/') {
      // Admin users should go to admin dashboard
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      }
      // Non-admin premium users go to premium dashboard
      else if (isPremium) {
        navigate('/premium-dashboard', { replace: true });
      }
    }
    // No need to redirect non-premium users here, let routes handle access control
  }, [authLoading, adminLoading, isAdmin, isPremium, location.pathname, navigate]);

  // Show loading indicator while auth/admin context is loading OR if redirecting
  if (authLoading || adminLoading || 
      ((isAdmin || isPremium) && location.pathname === '/')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  // If loading is finished and not redirecting, render children
  return <>{children}</>;
};

export default PremiumRedirect; 