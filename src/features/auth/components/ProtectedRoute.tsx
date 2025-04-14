import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePremium?: boolean;
}

export default function ProtectedRoute({ 
  children,
  requireAdmin = false,
  requirePremium = false
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user, refreshUser } = useAuth();
  const location = useLocation();

  // Refresh user data when accessing protected routes
  useEffect(() => {
    // If we're authenticated and not loading, refresh user data
    // Especially important for routes that require specific permissions
    if (isAuthenticated && !loading && (requireAdmin || requirePremium)) {
      console.log("[ProtectedRoute] Refreshing user data for permission-sensitive route");
      refreshUser();
    }
  }, [isAuthenticated, loading, requireAdmin, requirePremium]);

  // Save current location to sessionStorage when component mounts
  // This helps preserve the route when the page is refreshed
  useEffect(() => {
    if (isAuthenticated || loading) {
      sessionStorage.setItem('lastAuthenticatedRoute', location.pathname + location.search);
    }
    
    // Clean up when unmounting or after successful navigation
    return () => {
      if (isAuthenticated && !loading) {
        // Only clear if we're fully authenticated and no longer loading
        // This ensures we don't clear during the initial load
        const currentSavedRoute = sessionStorage.getItem('lastAuthenticatedRoute');
        if (currentSavedRoute === location.pathname + location.search) {
          sessionStorage.removeItem('lastAuthenticatedRoute');
        }
      }
    };
  }, [location, isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the current location and redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Additional permission checks
  if (requireAdmin && !user?.isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requirePremium && !user?.isPremium && !user?.isAdmin) {
    return <Navigate to="/premium" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 