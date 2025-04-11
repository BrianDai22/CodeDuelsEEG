/**
 * User Controller
 * Handles user-related callable functions
 */

const functions = require('firebase-functions');
const { isAdmin, isPremium } = require('../services/user');
const logger = require('firebase-functions/logger');

/**
 * Callable function to check user role based on email
 */
exports.getUserRole = functions.https.onCall(async (data, context) => {
  const email = data.email;
  
  if (!email) {
    logger.error('Missing email in getUserRole request');
    throw new functions.https.HttpsError('invalid-argument', 'Email is required.');
  }

  const adminStatus = isAdmin(email);
  const premiumStatus = isPremium(email);

  logger.info('User role checked', { email, isAdmin: adminStatus, isPremium: premiumStatus });
  
  return { 
    isAdmin: adminStatus, 
    isPremium: premiumStatus 
  };
}); 