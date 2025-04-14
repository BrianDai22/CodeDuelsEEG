import * as amplitude from '@amplitude/analytics-browser';

/**
 * Analytics configuration and utility functions
 */
export const analyticsConfig = {
  apiKey: import.meta.env.VITE_AMPLITUDE_API_KEY || 'default-key-for-dev',
  enabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  isDevelopment: import.meta.env.MODE === 'development',
};

/**
 * Initialize analytics when needed
 */
export const initAnalytics = () => {
  // Analytics initialization logic here without logging sensitive information
};

// Initialize Amplitude
export const initializeAnalytics = () => {
  if (analyticsConfig.enabled) {
    if (!analyticsConfig.apiKey || analyticsConfig.apiKey === 'default-key-for-dev') {
      // Don't log in production
      return;
    }
    
    try {
      amplitude.init(analyticsConfig.apiKey, undefined, {
        logLevel: amplitude.Types.LogLevel.None, // Prevent Amplitude from logging
        offline: true // Enable offline storage
      });
    } catch (error) {
      // Silent error handling without logging sensitive information
    }
  }
}; 