import { useCallback } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { analyticsConfig } from '@shared/lib/analytics';

interface ButtonClickEvent {
  buttonId: string;
  buttonText: string;
  path: string;
  additionalData?: Record<string, any>;
}

export const useButtonTracking = () => {
  const trackButtonClick = useCallback((
    buttonId: string,
    buttonText: string,
    additionalData?: Record<string, any>
  ) => {
    if (!analyticsConfig.enabled) return;

    const event: ButtonClickEvent = {
      buttonId,
      buttonText,
      path: window.location.pathname,
      additionalData
    };

    // Send to Amplitude
    try {
      amplitude.track('Button Click', event);
    } catch (error) {
      // Silently store failed event in localStorage without logging
      try {
        const failedEvents = JSON.parse(localStorage.getItem('failedEvents') || '[]');
        failedEvents.push(event);
        localStorage.setItem('failedEvents', JSON.stringify(failedEvents));
      } catch {
        // Silent failure
      }
    }
  }, []);

  return { trackButtonClick };
}; 