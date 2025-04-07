import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as amplitude from '@amplitude/analytics-browser';
import { analyticsConfig } from '@/lib/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (!analyticsConfig.enabled) return;

    try {
      amplitude.track('Page View', {
        path: location.pathname,
        title: document.title,
        referrer: document.referrer
      });
    } catch (error) {
      console.error('Failed to send page view to Amplitude:', error);
    }
  }, [location.pathname]);
}; 