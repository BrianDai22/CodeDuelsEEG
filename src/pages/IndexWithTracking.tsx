import React from 'react';
import { useAuth } from '@features/auth/AuthContext';
import { usePageTracking } from '@shared/hooks/analytics/usePageTracking';
import IndexPageContent from './IndexPageContent';

const IndexWithTracking = () => {
  const { isAuthenticated } = useAuth();
  
  // Use the analytics hook to track page views
  usePageTracking();
  
  return <IndexPageContent />;
};

export default IndexWithTracking;
