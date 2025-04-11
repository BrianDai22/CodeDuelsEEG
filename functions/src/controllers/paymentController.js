/**
 * Payment Controller
 * Handles payment-related HTTP functions and callable functions
 */

const functions = require('firebase-functions');
const { admin } = require('../config/firebase');
const { appUrl } = require('../config/firebase');
const { createCheckoutSession, getCheckoutSession } = require('../services/stripe');
const { updatePremiumStatus, recordPayment, getPaymentHistory } = require('../services/user');
const logger = require('firebase-functions/logger');

/**
 * HTTP function to create a Stripe checkout session
 */
exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { priceId, customerEmail } = req.body;

    if (!priceId) {
      logger.error('Missing priceId in request');
      return res.status(400).json({ error: 'Price ID is required' });
    }

    const successUrl = `${appUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/premium`;

    const session = await createCheckoutSession(
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

/**
 * Callable function to verify premium payment and update user status
 */
exports.verifyPremiumPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const userId = context.auth.uid;
  const email = context.auth.token.email;
  const sessionId = data.sessionId;

  if (!sessionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Session ID is required.');
  }

  try {
    // Check if this session ID has already been processed for this user
    const paymentRef = admin.database().ref(`premiumPayments/${userId}/${sessionId}`);
    const paymentSnapshot = await paymentRef.once('value');
    
    if (paymentSnapshot.exists()) {
      logger.info('Payment already verified for user', { userId, sessionId });
      return { success: true, message: 'Payment already verified.' };
    }

    // Retrieve the session from Stripe
    const session = await getCheckoutSession(sessionId);

    if (session.payment_status === 'paid') {
      // Payment successful, update user status in the database
      await updatePremiumStatus(userId, true);

      // Record the payment
      await recordPayment(userId, sessionId, {
        email: email || session.customer_email || 'unknown',
        paymentDate: admin.database.ServerValue.TIMESTAMP,
        amount: session.amount_total / 100, // Amount is in cents
        status: session.payment_status,
      });

      logger.info('Premium payment verified and user status updated', { userId, sessionId });
      return { success: true, message: 'Payment verified and status updated.' };
    } else {
      logger.warn('Payment verification failed: Payment not paid', { 
        userId, 
        sessionId, 
        status: session.payment_status 
      });
      throw new functions.https.HttpsError('failed-precondition', 'Payment not successful.');
    }
  } catch (error) {
    logger.error('Error verifying premium payment:', { 
      userId, 
      sessionId, 
      error: error.message 
    });
    
    if (error.type === 'StripeInvalidRequestError') {
      throw new functions.https.HttpsError('not-found', 'Invalid session ID.');
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to verify payment.');
  }
});

/**
 * Callable function to get payment history for the authenticated user
 */
exports.getPaymentHistory = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const userId = context.auth.uid;

  try {
    const paymentHistory = await getPaymentHistory(userId);
    return paymentHistory;
  } catch (error) {
    logger.error('Error fetching payment history:', { userId, error: error.message });
    throw new functions.https.HttpsError('internal', 'Failed to fetch payment history.');
  }
}); 