import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { getUserProfile } from '@/lib/api';

const PremiumRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const { isAdmin } = useAdmin();
  // Always start with false for guests
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to redirect premium users to premium dashboard
  const redirectToPremiumDashboard = useCallback(() => {
    if (isPremium && location.pathname === '/') {
      navigate('/premium-dashboard', { replace: true });
    }
  }, [isPremium, location.pathname, navigate]);

  // Check premium status on mount and when dependencies change
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        // Guest accounts are never premium
        if (!isAuthenticated || !user) {
          setIsPremium(false);
          setLoading(false);
          return;
        }

        // Check if user has premium in localStorage first
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          // Only consider authenticated users with premium or admin status
          if (profile.isPremium || (isAdmin && !!user)) {
            setIsPremium(true);
            setLoading(false);
            redirectToPremiumDashboard();
            return;
          }
        }

        // If not in localStorage, check with the API
        const profile = await getUserProfile();
        // Only consider authenticated users with premium or admin status
        const hasPremium = profile.isPremium || (isAdmin && !!user);
        setIsPremium(hasPremium);

        // Update localStorage
        if (hasPremium) {
          const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
          storedProfile.isPremium = true;
          localStorage.setItem('userProfile', JSON.stringify(storedProfile));
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        // Don't reset isPremium here, maintain the localStorage value
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile && isAuthenticated && user) {
          const profile = JSON.parse(userProfile);
          // Only consider authenticated users with premium or admin status
          setIsPremium(profile.isPremium || (isAdmin && !!user));
        } else {
          // If no profile in localStorage or not authenticated, default to non-premium
          setIsPremium(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, [isAuthenticated, isAdmin, redirectToPremiumDashboard, user]);

  // Handle location changes
  useEffect(() => {
    redirectToPremiumDashboard();
  }, [location, redirectToPremiumDashboard]);

  // Always show loading state for premium users on the root path
  if (isPremium && location.pathname === '/') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading state while checking premium status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PremiumRedirect; 