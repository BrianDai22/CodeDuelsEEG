import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { Loader2 } from 'lucide-react';

const PremiumRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine premium status directly from user context
  const isPremium = user?.isPremium || false;

  useEffect(() => {
    // Redirect premium users from root path to premium dashboard
    if (!authLoading && isPremium && location.pathname === '/') {
      navigate('/premium-dashboard', { replace: true });
    }
    // No need to redirect non-premium users here, let routes handle access control
  }, [authLoading, isPremium, location.pathname, navigate]);

  // Show loading indicator while auth context is loading OR if redirecting
  if (authLoading || (isPremium && location.pathname === '/')) {
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