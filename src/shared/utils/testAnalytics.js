import * as amplitude from '@amplitude/analytics-browser';
import { analyticsConfig } from '@shared/lib/analytics';

/**
 * Utility to test if Amplitude is properly configured and working
 * ONLY FOR DEVELOPMENT USE - will not run in production
 */
export const testAmplitude = () => {
  // Skip in production to prevent exposing sensitive information
  if (!analyticsConfig.isDevelopment) {
    return false;
  }
  
  // Only check basic enabled status
  if (!analyticsConfig.enabled) {
    return false;
  }
  
  const hasApiKey = Boolean(analyticsConfig.apiKey) && analyticsConfig.apiKey !== 'default-key-for-dev';
  if (!hasApiKey) {
    return false;
  }
  
  // Send a test event silently
  try {
    amplitude.track('Test Event', {
      source: 'testAmplitude function',
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if Amplitude is already initialized
 */
export const isAmplitudeInitialized = () => {
  try {
    // Try to access the Amplitude instance
    return amplitude.getInstance().isInitialized();
  } catch (error) {
    return false;
  }
}; 