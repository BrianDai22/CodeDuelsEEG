import React from 'react';
import { useAuth } from '@features/auth/AuthContext';
import { usePageTracking } from '@shared/hooks/analytics/usePageTracking';
// import Index from './Index'; // Remove circular import
import IndexPageContent from './IndexPageContent'; // Import the actual content
import WaitlistForm from '@shared/components/WaitlistForm';

const IndexWithTracking = () => {
  const { isAuthenticated } = useAuth();
  usePageTracking();
  
  // TODO: Add logic here if needed (e.g., show WaitlistForm if !isAuthenticated)
  return <IndexPageContent />; // Render the actual content
};

export default IndexWithTracking;
