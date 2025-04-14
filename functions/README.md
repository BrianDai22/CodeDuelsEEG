# Code Duels Backend - Firebase Cloud Functions

This directory contains the serverless backend functionality for Code Duels EEG, implemented with Firebase Cloud Functions.

## Structure

```
functions/
├── src/
│   ├── services/         # Business logic
│   │   ├── stripe.js     # Stripe payment service
│   │   └── user.js       # User management service
│   └── config/           # Configuration settings (environment variables)
├── index.js              # Main entry point & Cloud Function definitions
├── package.json          # Dependencies and scripts
└── .eslintrc.js          # ESLint configuration
```

## Available Cloud Functions

### HTTP Functions (REST API)
- `createCheckoutSession` - Creates a Stripe checkout session for premium purchases

### Callable Functions (Firebase SDK)
- `getUserRole` - Checks if a user has admin or premium privileges
- `verifyPremiumPayment` - Verifies a payment and updates user premium status
- `getPaymentHistory` - Retrieves payment history for the authenticated user
- `setUserPremiumStatus` - Admin-only function to manually set a user's premium status

## Authentication & Security

The backend implements a security model that:
- Requires Firebase Authentication for sensitive operations
- Verifies permissions server-side, not trusting client claims
- Uses Firebase Parameters for secure environment configuration
- Validates input data before processing

## Firebase Configuration Parameters

The application uses the following Firebase parameters:
- `STRIPE_SECRET_KEY` - Stripe API key for payment processing
- `APP_URL` - Base URL for the frontend application
- `AUTH_ADMIN_EMAILS` - Comma-separated list of admin email addresses
- `AUTH_PREMIUM_EMAILS` - Comma-separated list of emails with default premium access

## Development

### Setup
1. Install dependencies: `npm install`
2. Set up Firebase parameters:
   ```
   firebase functions:config:set stripe.secret_key=sk_... app.url=https://your-app-url.com
   ```
3. Create environment file for local development:
   ```
   firebase functions:config:get > .env.code-duels-89859
   ```

### Running Locally
- Start Firebase emulators: `npm run serve`
- Use shell for debugging: `npm run shell`

### Deployment
- Deploy to Firebase: `npm run deploy`
- View logs: `npm run logs` 