/**
 * Analytics Service
 * Handles server-side analytics tracking with Amplitude
 */

const { Amplitude, Types } = require('@amplitude/analytics-node');
const logger = require('firebase-functions/logger');
const { defineString } = require('firebase-functions/params');

// Define Amplitude API key parameter
const AMPLITUDE_API_KEY = defineString('AMPLITUDE_API_KEY');

// Initialize Amplitude client
let amplitude = null;

/**
 * Initialize the Amplitude client
 */
function initializeAnalytics() {
  // Check if we have a valid API key
  const apiKey = AMPLITUDE_API_KEY.value();
  if (!apiKey) {
    logger.warn('Amplitude API key not configured. Backend analytics will be disabled.');
    return false;
  }

  try {
    // Create new instance
    amplitude = new Amplitude(apiKey, {
      logLevel: Types.LogLevel.None // Prevent any console output
    });
    logger.info('Amplitude analytics initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Amplitude analytics');
    return false;
  }
}

/**
 * Track a server-side event
 * @param {string} eventType - The type of event to track
 * @param {object} eventProperties - Additional properties to track
 * @param {string} userId - Optional user ID to associate with the event
 */
async function trackEvent(eventType, eventProperties = {}, userId = null) {
  if (!amplitude) {
    if (!initializeAnalytics()) {
      return;
    }
  }

  try {
    const event = {
      event_type: eventType,
      event_properties: eventProperties,
      user_id: userId,
      time: Date.now()
    };

    await amplitude.track(event);
    // Log minimal info without event details
    logger.debug('Tracked event', { eventType });
  } catch (error) {
    logger.error('Failed to track event');
  }
}

/**
 * Track a user-specific event
 * @param {string} userId - User ID to track
 * @param {string} eventType - Event type
 * @param {object} eventProperties - Event properties
 */
async function trackUserEvent(userId, eventType, eventProperties = {}) {
  if (!userId) {
    logger.warn('Cannot track user event without userId');
    return;
  }
  
  return trackEvent(eventType, eventProperties, userId);
}

module.exports = {
  initializeAnalytics,
  trackEvent,
  trackUserEvent
}; 