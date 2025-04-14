import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PremiumHeader from '@shared/components/PremiumHeader';
import LandingFooter from '@shared/components/LandingFooter';

/**
 * HOC that injects the premium UI context into components
 * when accessed via a /premium/ route.
 */
const PremiumRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isPremiumRoute = location.pathname.startsWith('/premium/');

  // For non-premium routes, just render children normally
  if (!isPremiumRoute) {
    return <>{children}</>;
  }

  // Add a class to the document body to allow CSS targeting premium routes
  useEffect(() => {
    document.body.classList.add('premium-route');
    return () => {
      document.body.classList.remove('premium-route');
    };
  }, []);

  // Instead of wrapping in a new layout, just return the children
  // The headers within components will detect the premium path and use PremiumHeader
  return <>{children}</>;
};

export default PremiumRouteWrapper; 