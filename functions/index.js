/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest, onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {defineString} = require('firebase-functions/params');
const Stripe = require("stripe");
const admin = require("firebase-admin");
const functions = require("firebase-functions");

// Import services
const analyticsService = require('./src/services/analytics');

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Define parameters
const STRIPE_SECRET_KEY = defineString('STRIPE_SECRET_KEY');
const APP_URL = defineString('APP_URL');
// Adding admin and premium email parameters without default values
const AUTH_ADMIN_EMAILS = defineString('AUTH_ADMIN_EMAILS');
const AUTH_PREMIUM_EMAILS = defineString('AUTH_PREMIUM_EMAILS');

// Initialize Firebase Admin (safe at top level)
admin.initializeApp();
const db = admin.database();

// Import services (safe at top level)
// const paymentControllerLogic = require('./src/controllers/paymentController'); // Deleted
// const userController = require('./src/controllers/userController'); // Deleted
const stripeService = require('./src/services/stripe');
const userService = require('./src/services/user'); // Import user service directly

// Initialize Stripe *inside* the handler that uses it
exports.createCheckoutSession = onRequest({ cors: false }, async (req, res) => {
  // Set CORS headers for preflight and actual requests - restrict to specific origin
  const allowedOrigins = APP_URL.value().split(',');
  const origin = req.headers.origin;
  
  // Only allow specific origins
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    // Log potential CORS attack attempt
    logger.warn('Unauthorized origin attempt:', { 
      origin: origin || 'undefined', 
      ip: req.ip || 'unknown',
      path: req.path
    });
  }

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS preflight request
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
    
    // Set security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    res.status(204).send('');
    return;
  }

  // --- Handle actual POST request --- 

  const stripeSecretKeyValue = STRIPE_SECRET_KEY.value();
  const appUrlValue = APP_URL.value();

  const stripe = new Stripe(stripeSecretKeyValue, {
    apiVersion: "2023-10-16",
  });

  if (req.method !== 'POST') { // This check might be redundant now but safe to keep
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { priceId, customerEmail } = req.body;

    // Enhanced input validation
    if (!priceId) {
      logger.error('Missing priceId in request');
      return res.status(400).json({ error: 'Price ID is required' });
    }
    
    // Validate priceId format (assuming it follows Stripe's price_XXX format)
    if (typeof priceId !== 'string' || !priceId.startsWith('price_')) {
      logger.error('Invalid priceId format', { priceId });
      return res.status(400).json({ error: 'Invalid Price ID format' });
    }
    
    // Validate email if provided
    if (customerEmail && (typeof customerEmail !== 'string' || 
        !customerEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))) {
      logger.error('Invalid email format', { customerEmail });
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Set security headers for response
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    const successUrl = `${appUrlValue}/premium/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrlValue}/premium`;

    const session = await stripeService.createCheckoutSession(
      stripe, 
      priceId,
      customerEmail,
      successUrl,
      cancelUrl
    );

    res.json({ id: session.id });
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
});

// V2 Callable Function
exports.verifyPremiumPayment = onCall({ region: 'us-central1' }, async (request) => {
  // Ensure user is authenticated (v2 checks request.auth)
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const stripeSecretKeyValue = STRIPE_SECRET_KEY.value();
  const stripe = new Stripe(stripeSecretKeyValue, {
    apiVersion: "2023-10-16",
  });

  const userId = request.auth.uid;
  const email = request.auth.token.email;
  const sessionId = request.data.sessionId; // Access data via request.data

  if (!sessionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Session ID is required.');
  }

  try {
    const session = await stripeService.getCheckoutSession(stripe, sessionId);
    const paymentRef = db.ref(`premiumPayments/${userId}/${sessionId}`);
    const paymentSnapshot = await paymentRef.once('value');

    if (paymentSnapshot.exists()) {
      logger.info('Payment already verified for user', { userId, sessionId });
      return { success: true, message: 'Payment already verified.' };
    }

    if (session.payment_status === 'paid') {
      // Use functions from imported userService
      await userService.updatePremiumStatus(userId, true);
      await userService.recordPayment(userId, sessionId, {
        email: email || session.customer_details?.email || 'unknown',
        paymentDate: admin.database.ServerValue.TIMESTAMP,
        amount: session.amount_total / 100,
        status: session.payment_status,
      });
      
      // Track successful premium purchase in Amplitude
      await analyticsService.trackUserEvent(userId, 'Premium Purchase', {
        sessionId,
        amount: session.amount_total / 100,
        currency: session.currency,
        email: email || session.customer_details?.email || 'unknown',
        paymentMethod: session.payment_method_types?.[0] || 'unknown'
      });
      
      logger.info('Premium payment verified and user status updated', { userId, sessionId });
      return { success: true, message: 'Payment verified and status updated.' };
    } else {
      logger.warn('Payment verification failed: Payment not paid', { userId, sessionId, status: session.payment_status });
      throw new functions.https.HttpsError('failed-precondition', 'Payment not successful.');
    }
  } catch (error) {
    logger.error('Error verifying premium payment:', { userId, sessionId, error: error.message });
    if (error.type === 'StripeInvalidRequestError') {
      throw new functions.https.HttpsError('not-found', 'Invalid session ID.');
    }
    const code = error.code instanceof functions.https.HttpsError ? error.code : 'internal';
    throw new functions.https.HttpsError(code, error.message || 'Failed to verify payment.');
  }
});

// V2 Callable Function
exports.getUserRole = onCall({ region: 'us-central1' }, async (request) => { // Changed to async
  // Get admin emails from parameters using v2 method
  const adminEmailsStr = AUTH_ADMIN_EMAILS.value();
  const premiumEmailsStr = AUTH_PREMIUM_EMAILS.value();
  
  // Parse emails into arrays
  const adminEmails = adminEmailsStr ? 
    adminEmailsStr.split(',').map(e => e.trim()).filter(Boolean) : 
    [];
  
  // For premium emails, default to admins if not configured
  const premiumEmails = premiumEmailsStr ? 
    premiumEmailsStr.split(',').map(e => e.trim()).filter(Boolean) : 
    adminEmails;

  // If authenticated request, use the auth token email directly (more secure)
  let email;
  let userId;
  if (request.auth) {
    email = request.auth.token.email;
    userId = request.auth.uid;
    logger.info('getUserRole using authenticated email', { email, userId });
  } else {
    // Fallback to data.email for non-authenticated requests
    email = request.data && request.data.email;
    logger.info('getUserRole using provided email', { email });
  }

  // Enhanced validation checks
  if (!email) {
    logger.error('Missing email in getUserRole request');
    throw new functions.https.HttpsError('invalid-argument', 'Email is required.');
  }
  
  // Validate email format
  if (typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    logger.error('Invalid email format', { email });
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email format.');
  }

  // Rate limiting check - consider implementing a more robust solution
  // This is a simple example that could be expanded
  const ipAddress = request.rawRequest?.ip || 'unknown';
  const rateRef = db.ref(`rateLimits/getUserRole/${ipAddress.replace(/\./g, '_')}`);
  const rateSnapshot = await rateRef.once('value');
  const rateData = rateSnapshot.val() || { count: 0, timestamp: 0 };
  
  // Reset count if more than 1 minute has passed
  const now = Date.now();
  if (now - rateData.timestamp > 60000) {
    rateData.count = 0;
    rateData.timestamp = now;
  }
  
  // Check if rate limit exceeded (10 requests per minute)
  if (rateData.count >= 10) {
    logger.warn('Rate limit exceeded for getUserRole', { ipAddress, email });
    throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Please try again later.');
  }
  
  // Update rate limit counter
  rateData.count++;
  await rateRef.set(rateData);

  // Determine status from configured lists
  const adminStatus = adminEmails.includes(email);
  
  // Default premium status from configuration
  let premiumStatus = premiumEmails.includes(email) || adminStatus;

  // Check if the user has premium from database if they're authenticated
  if (userId) {
    try {
      // Check if user has any premium payments
      const paymentRef = db.ref(`premiumPayments/${userId}`);
      const paymentSnapshot = await paymentRef.once('value');
      const hasPremiumPayments = paymentSnapshot.exists();
      
      // Also check user's isPremium flag in the database
      const userRef = db.ref(`users/${userId}`);
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val() || {};
      const userHasPremiumFlag = userData.isPremium === true;
      
      // If any source indicates premium status, grant premium
      if (hasPremiumPayments || userHasPremiumFlag) {
        premiumStatus = true;
        logger.info('User has premium status', { 
          userId, 
          fromPayments: hasPremiumPayments, 
          fromUserData: userHasPremiumFlag 
        });
        
        // Update user record to ensure consistent premium status
        if (!userHasPremiumFlag && hasPremiumPayments) {
          await userRef.update({ isPremium: true });
          logger.info('Updated user premium status based on payment records', { userId });
        }
      }
      
      // Ensure admin status is also consistent in database
      if (userData.isAdmin !== adminStatus) {
        await userRef.update({ isAdmin: adminStatus });
        logger.info('Updated user admin status to match configuration', { userId, adminStatus });
      }
    } catch (error) {
      logger.error('Error checking user premium status:', { userId, error: error.message });
      // Continue with the default determination if there's an error
    }
  }

  logger.info('User role checked', { email, isAdmin: adminStatus, isPremium: premiumStatus });

  return {
    isAdmin: adminStatus,
    isPremium: premiumStatus
  };
});

// V2 Callable Function
exports.getPaymentHistory = onCall({ region: 'us-central1' }, async (request) => {
  // Ensure user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const userId = request.auth.uid;

  try {
    // Import the service function here or ensure it's imported globally
    // We can call the service directly as it only needs the userId and db (globally available)
    const { getPaymentHistory: getPaymentHistoryService } = require('./src/services/user');
    
    const paymentHistory = await getPaymentHistoryService(userId);
    return paymentHistory;
  } catch (error) {
    logger.error('Error fetching payment history:', { userId, error: error.message });
    const code = error.code instanceof functions.https.HttpsError ? error.code : 'internal';
    throw new functions.https.HttpsError(code, error.message || 'Failed to fetch payment history.');
  }
});

// New secure function to set admin status
exports.setUserAdminStatus = onCall({ region: 'us-central1' }, async (request) => {
  // Ensure user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const callerUid = request.auth.uid;
  const targetUid = request.data.userId;
  const newStatus = request.data.isAdmin;
  
  // Verify caller is an admin by checking against our admin emails
  const callerEmail = request.auth.token.email;
  const adminEmailsStr = AUTH_ADMIN_EMAILS.value();
  const adminEmails = adminEmailsStr ? 
    adminEmailsStr.split(',').map(e => e.trim()).filter(Boolean) : 
    [];
  
  const isCallerAdmin = adminEmails.includes(callerEmail);
  
  if (!isCallerAdmin) {
    logger.error('Non-admin attempt to set admin status', { callerUid, callerEmail });
    throw new functions.https.HttpsError('permission-denied', 'Only admins can change admin status.');
  }
  
  try {
    // Update the user's admin status in the database
    const userRef = db.ref(`users/${targetUid}`);
    await userRef.update({ isAdmin: newStatus });
    
    logger.info('User admin status updated', { 
      callerUid, 
      targetUid, 
      newStatus,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    
    return { 
      success: true, 
      message: `Admin status ${newStatus ? 'granted' : 'revoked'} successfully.` 
    };
  } catch (error) {
    logger.error('Error updating user admin status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update admin status.');
  }
});

// New secure function with audit logging to set premium status
exports.setUserPremiumStatus = onCall({ region: 'us-central1' }, async (request) => {
  // Ensure user is authenticated
  if (!request.auth) {
    logger.error('Unauthenticated attempt to set premium status');
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const callerUid = request.auth.uid;
  
  // Enhanced input validation
  if (!request.data || typeof request.data !== 'object') {
    logger.error('Invalid request data format', { callerUid });
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request format.');
  }
  
  const { userId, isPremium } = request.data;
  
  // Validate userId
  if (!userId || typeof userId !== 'string' || userId.length < 5) {
    logger.error('Invalid userId format', { callerUid, userId });
    throw new functions.https.HttpsError('invalid-argument', 'Invalid user ID format.');
  }
  
  // Validate premium status
  if (typeof isPremium !== 'boolean') {
    logger.error('Invalid isPremium format', { callerUid, isPremium });
    throw new functions.https.HttpsError('invalid-argument', 'Premium status must be a boolean.');
  }
  
  // Verify caller is an admin by checking against our admin emails
  const callerEmail = request.auth.token.email;
  const adminEmailsStr = AUTH_ADMIN_EMAILS.value();
  const adminEmails = adminEmailsStr ? 
    adminEmailsStr.split(',').map(e => e.trim()).filter(Boolean) : 
    [];
  
  const isCallerAdmin = adminEmails.includes(callerEmail);
  
  if (!isCallerAdmin) {
    // Important security log with full details
    logger.error('Non-admin attempt to set premium status', { 
      callerUid, 
      callerEmail,
      targetUid: userId,
      newStatus: isPremium,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      ipAddress: request.rawRequest?.ip || 'unknown'
    });
    
    throw new functions.https.HttpsError('permission-denied', 'Only admins can change premium status manually.');
  }
  
  // Add rate limiting for premium status changes (5 changes per minute)
  const ipAddress = request.rawRequest?.ip || 'unknown';
  const rateRef = db.ref(`rateLimits/setUserPremiumStatus/${callerUid}`);
  const rateSnapshot = await rateRef.once('value');
  const rateData = rateSnapshot.val() || { count: 0, timestamp: 0 };
  
  // Reset count if more than 1 minute has passed
  const now = Date.now();
  if (now - rateData.timestamp > 60000) {
    rateData.count = 0;
    rateData.timestamp = now;
  }
  
  // Check if rate limit exceeded (5 status changes per minute)
  if (rateData.count >= 5) {
    logger.warn('Rate limit exceeded for setUserPremiumStatus', { callerUid, ipAddress });
    throw new functions.https.HttpsError('resource-exhausted', 'Too many status changes. Please try again later.');
  }
  
  // Update rate limit counter
  rateData.count++;
  await rateRef.set(rateData);
  
  // Validate target user exists
  try {
    const targetUserRef = db.ref(`users/${userId}`);
    const targetUserSnapshot = await targetUserRef.once('value');
    
    if (!targetUserSnapshot.exists()) {
      logger.error('Attempt to change premium status for non-existent user', { userId });
      throw new functions.https.HttpsError('not-found', 'Target user does not exist.');
    }
    
    // Create audit log entry
    const auditRef = db.ref(`auditLogs/premiumStatusChanges`).push();
    await auditRef.set({
      callerUid,
      callerEmail,
      targetUid: userId,
      previousStatus: targetUserSnapshot.val().isPremium || false,
      newStatus: isPremium,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      ipAddress: request.rawRequest?.ip || 'unknown',
      userAgent: request.rawRequest?.headers?.['user-agent'] || 'unknown'
    });
    
    // Update the user's premium status in the database
    await targetUserRef.update({ isPremium });
    
    logger.info('User premium status updated', { 
      callerUid, 
      targetUid: userId, 
      newStatus: isPremium,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    
    return { 
      success: true, 
      message: `Premium status ${isPremium ? 'granted' : 'revoked'} successfully.` 
    };
  } catch (error) {
    logger.error('Error updating user premium status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update premium status.');
  }
});

// Initialize Amplitude analytics for server-side tracking
analyticsService.initializeAnalytics();
