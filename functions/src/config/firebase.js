/**
 * Firebase Configuration
 * Initializes Firebase Admin SDK and exports configuration settings
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const logger = require('firebase-functions/logger');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Database
const db = admin.database();

// Get config values from Firebase
const stripeSecretKey = functions.config().stripe?.secret_key;
const appUrl = functions.config().app?.url;
const authorizedAdminEmails = (functions.config().auth?.admin_emails || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);
const authorizedPremiumEmails = (functions.config().auth?.premium_emails || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

// Validate required configuration
if (!stripeSecretKey) {
  logger.warn('Stripe secret key is not configured. Run: firebase functions:config:set stripe.secret_key=sk_...');
}

if (!appUrl) {
  logger.warn('App URL is not configured. Run: firebase functions:config:set app.url=https://your-app-url.com');
}

module.exports = {
  admin,
  db,
  stripeSecretKey,
  appUrl,
  authorizedAdminEmails,
  authorizedPremiumEmails,
}; 