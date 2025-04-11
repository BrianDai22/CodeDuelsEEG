# Code Duels Backend - Firebase Cloud Functions

This directory contains the serverless backend functionality for Code Duels EEG, implemented with Firebase Cloud Functions.

## Structure

```
functions/
├── src/
│   ├── config/           # Configuration settings
│   ├── controllers/      # Function controllers (routes)
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
├── index.js              # Main entry point
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

## Development

### Setup
1. Install dependencies: `npm install`
2. Set up Firebase configuration:
   ```
   firebase functions:config:set stripe.secret_key=sk_... app.url=https://your-app-url.com
   ```

### Running Locally
- Start Firebase emulators: `npm run serve`
- Use shell for debugging: `npm run shell`

### Deployment
- Deploy to Firebase: `npm run deploy`
- View logs: `npm run logs` 