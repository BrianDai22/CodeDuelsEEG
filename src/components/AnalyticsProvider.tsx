import { ReactNode, useEffect } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';
import { initializeAnalytics } from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  // Initialize Amplitude
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Initialize page tracking
  usePageTracking();

  return <>{children}</>;
}; 