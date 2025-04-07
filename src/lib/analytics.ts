import * as amplitude from '@amplitude/analytics-browser';

export interface AnalyticsConfig {
  apiKey: string;
  enabled: boolean;
}

export const analyticsConfig: AnalyticsConfig = {
  apiKey: 'eb80b03d603c4dc9cb42249602db36d8', // Your Amplitude API key
  enabled: true
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