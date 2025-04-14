import React, { ReactNode, useEffect } from 'react';
import { usePageTracking } from '@shared/hooks/analytics/usePageTracking';
import { initializeAnalytics } from '@shared/lib/analytics';

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
