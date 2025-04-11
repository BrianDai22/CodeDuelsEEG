/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const Stripe = require("stripe");
const admin = require("firebase-admin");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp();
const db = admin.database();

// Get config values from Firebase
const stripeSecretKey = functions.config().stripe.secret_key;
const appUrl = functions.config().app.url;
const authorizedAdminEmails = (functions.config().auth?.admin_emails || '').split(',').map(e => e.trim()).filter(Boolean);
const authorizedPremiumEmails = (functions.config().auth?.premium_emails || '').split(',').map(e => e.trim()).filter(Boolean);

if (!stripeSecretKey) {
  throw new Error('Stripe secret key is not configured. Run: firebase functions:config:set stripe.secret_key=sk_...');
}

if (!appUrl) {
  throw new Error('App URL is not configured. Run: firebase functions:config:set app.url=https://your-app-url.com');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

// Import controllers
const paymentController = require('./src/controllers/paymentController');
const userController = require('./src/controllers/userController');

// Export payment functions
exports.createCheckoutSession = paymentController.createCheckoutSession;
exports.verifyPremiumPayment = paymentController.verifyPremiumPayment;
exports.getPaymentHistory = paymentController.getPaymentHistory;

// Export user functions
exports.getUserRole = userController.getUserRole;
