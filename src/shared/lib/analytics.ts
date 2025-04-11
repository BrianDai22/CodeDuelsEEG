import * as amplitude from '@amplitude/analytics-browser';

/**
 * Analytics configuration and utility functions
 */
export const analyticsConfig = {
  apiKey: import.meta.env.VITE_AMPLITUDE_API_KEY || 'default-key-for-dev',
  enabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
};

/**
 * Initialize analytics when needed
 */
export const initAnalytics = () => {
  // Analytics initialization logic here
  console.log('Analytics initialized with config:', analyticsConfig);
};

// Initialize Amplitude
export const initializeAnalytics = () => {
  if (analyticsConfig.enabled && analyticsConfig.apiKey) {
    amplitude.init(analyticsConfig.apiKey, undefined, {
      logLevel: amplitude.Types.LogLevel.Error,
      offline: true // Enable offline storage
    });
  }
}; 