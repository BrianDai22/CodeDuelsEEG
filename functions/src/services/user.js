/**
 * User Service
 * Handles user-related operations like checking roles and managing premium status
 */

const { db, authorizedAdminEmails, authorizedPremiumEmails } = require('../config/firebase');
const logger = require('firebase-functions/logger');

/**
 * Checks if a user has admin privileges
 * @param {string} email - The user's email
 * @returns {boolean} True if the user is an admin
 */
function isAdmin(email) {
  return authorizedAdminEmails.includes(email);
}

/**
 * Checks if a user has premium status
 * @param {string} email - The user's email
 * @returns {boolean} True if the user has premium status
 */
function isPremium(email) {
  return authorizedPremiumEmails.includes(email) || isAdmin(email);
}

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
  isAdmin,
  isPremium,
  updatePremiumStatus,
  recordPayment,
  getPaymentHistory,
}; 