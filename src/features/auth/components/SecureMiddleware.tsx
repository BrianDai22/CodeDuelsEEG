import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { verifyBackendRole } from '@shared/utils/frontendBackendSeparation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SecureMiddlewareProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePremium?: boolean;
  fallbackPath?: string;
}

/**
 * A secure middleware component that performs backend verification
 * for sensitive routes before rendering the protected content.
 * 
 * This is more secure than ProtectedRoute as it always performs a
 * server-side check rather than relying on client-cached permissions.
 */
export default function SecureMiddleware({
  children,
  requireAdmin = false,
  requirePremium = false,
  fallbackPath = '/'
}: SecureMiddlewareProps) {
  const { user, loading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  // Verify permissions with backend on every render
  useEffect(() => {
    const verifyPermissions = async () => {
      if (!user) {
        setIsAuthorized(false);
        setIsVerifying(false);
        return;
      }

      try {
        setIsVerifying(true);
        
        let hasPermission = true;
        
        // Check admin status if required
        if (requireAdmin) {
          const isAdmin = await verifyBackendRole('getUserRole', 'isAdmin');
          if (!isAdmin) {
            hasPermission = false;
            // Remove toast notification for admin privileges
          }
        }
        
        // Check premium status if required
        if (requirePremium && hasPermission) {
          const isPremium = await verifyBackendRole('getUserRole', 'isPremium');
          if (!isPremium) {
            hasPermission = false;
            toast.error('Access denied. Premium subscription required.');
          }
        }
        
        setIsAuthorized(hasPermission);
      } catch (error) {
        console.error('Error verifying permissions:', error);
        setIsAuthorized(false);
        toast.error('Failed to verify permissions. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    if (!loading) {
      verifyPermissions();
    }
  }, [user?.id, loading, requireAdmin, requirePremium, location.pathname]);

  // Show loading indicator while checking authentication or verifying permissions
  if (loading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            {loading ? 'Checking authentication...' : 'Verifying permissions...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not authorized, redirect to fallback
  if (!isAuthorized) {
    return <Navigate to={fallbackPath} replace />;
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
} 