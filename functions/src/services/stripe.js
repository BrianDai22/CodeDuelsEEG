/**
 * Stripe Service
 * Handles Stripe API interactions for payments
 */

const Stripe = require('stripe');
const { stripeSecretKey } = require('../config/firebase');
const logger = require('firebase-functions/logger');

// Initialize Stripe with the API key
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

/**
 * Creates a checkout session for premium subscription
 * @param {string} priceId - The Stripe price ID
 * @param {string} customerEmail - Customer's email
 * @param {string} successUrl - URL to redirect after successful payment
 * @param {string} cancelUrl - URL to redirect after cancelled payment
 * @returns {Promise<Object>} The created checkout session
 */
async function createCheckoutSession(priceId, customerEmail, successUrl, cancelUrl) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        customerEmail: customerEmail || 'unknown',
      },
    });

    logger.info('Checkout session created', { sessionId: session.id });
    return session;
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieves a checkout session by ID
 * @param {string} sessionId - The Stripe session ID
 * @returns {Promise<Object>} The checkout session
 */
async function getCheckoutSession(sessionId) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    logger.error('Error retrieving checkout session:', error);
    throw error;
  }
}

module.exports = {
  stripe,
  createCheckoutSession,
  getCheckoutSession,
}; 