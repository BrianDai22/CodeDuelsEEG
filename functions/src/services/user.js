/**
 * User Service
 * Handles user-related operations like managing premium status and payments
 */

// Import admin SDK to access the globally initialized instance
const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');

// Access the globally initialized db instance from index.js
const db = admin.database();

/**
 * Updates a user's premium status
 * @param {string} userId - The user's ID
 * @param {boolean} status - The premium status to set
 * @returns {Promise<void>}
 */
async function updatePremiumStatus(userId, status) {
  try {
    const userRef = db.ref(`users/${userId}`);
    await userRef.update({ isPremium: status });
    logger.info('User premium status updated', { userId, status });
  } catch (error) {
    logger.error('Error updating user premium status:', error);
    throw error;
  }
}

/**
 * Records a premium payment in the database
 * @param {string} userId - The user's ID
 * @param {string} sessionId - The payment session ID
 * @param {Object} paymentData - The payment data to record
 * @returns {Promise<void>}
 */
async function recordPayment(userId, sessionId, paymentData) {
  try {
    const paymentRef = db.ref(`premiumPayments/${userId}/${sessionId}`);
    await paymentRef.set(paymentData);
    logger.info('Payment recorded for user', { userId, sessionId });
  } catch (error) {
    logger.error('Error recording payment:', error);
    throw error;
  }
}

/**
 * Gets a user's payment history
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} The user's payment history
 */
async function getPaymentHistory(userId) {
  try {
    const paymentsRef = db.ref(`premiumPayments/${userId}`);
    const snapshot = await paymentsRef.once('value');
    const paymentsData = snapshot.val();

    if (!paymentsData) {
      return []; // No payment history found
    }

    // Convert the object of payments into an array
    const paymentHistory = Object.entries(paymentsData).map(([sessionId, paymentDetails]) => ({
      sessionId,
      ...paymentDetails,
    }));

    // Sort by paymentDate descending (most recent first)
    paymentHistory.sort((a, b) => (b.paymentDate || 0) - (a.paymentDate || 0));

    return paymentHistory;
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    throw error;
  }
}

module.exports = {
  updatePremiumStatus,
  recordPayment,
  getPaymentHistory,
}; 