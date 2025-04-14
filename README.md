# Code Duels EEG Project

This repository contains both the frontend application and the backend serverless functions for Code Duels EEG.

## Project Overview

Code Duels is a competitive coding platform where users can:
- Battle other developers in coding challenges
- Track their performance on leaderboards
- Access premium features through a subscription model
- Manage their profile and view match history
- Monitor brain activity during coding sessions via EEG integration

The application uses a modern React frontend with Firebase backend services and integrates with EEG hardware to provide real-time brain activity monitoring during coding challenges.

## Directory Structure

```
/
├── src/                # Frontend source code
├── functions/          # Backend Firebase Cloud Functions
├── config/             # Configuration files
├── public/             # Static public assets
└── node_modules/       # Dependencies
```

## Frontend Architecture (src/)

```
src/
├── assets/           # Static assets (images, fonts, etc.)
├── core/             # Application core
│   ├── auth/         # Authentication context, providers, hooks
│   └── providers/    # Global providers
├── features/         # Feature-based modules
│   ├── admin/        # Admin feature module
│   ├── arena/        # Battle feature module
│   ├── auth/         # Auth feature module
│   ├── leaderboard/  # Leaderboard feature module
│   ├── premium/      # Premium feature module
│   └── profile/      # User profile feature module
├── layouts/          # Layout components
│   ├── headers/      # Header components
│   └── footers/      # Footer components
├── pages/            # Standalone page wrappers
├── shared/           # Shared utilities
│   ├── api/          # API utilities
│   ├── components/   # Shared components
│   ├── context/      # Context providers (Admin, Premium)
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Helper libraries
│   └── utils/        # Utility functions
├── ui/               # UI component library
├── App.tsx           # Application entry component
├── main.tsx          # Application bootstrap
└── index.css         # Global styles
```

## Backend Architecture (functions/)

```
functions/
├── src/
│   ├── services/     # Business logic services
│   │   ├── stripe.js # Stripe payment service
│   │   └── user.js   # User management service
│   └── config/       # Configuration settings
├── index.js          # Cloud Functions entry point
└── package.json      # Dependencies and scripts
```

## Key Technologies

### Frontend
- React with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Shadcn UI component library (based on Radix UI)
- Firebase SDK for auth and data
- TanStack Query for data fetching
- WebSocket API for real-time EEG data streaming

### Backend
- Firebase Cloud Functions
- Firebase Authentication
- Firebase Realtime Database
- Stripe for payment processing
- WebSocket server for EEG data processing

## Setting Up Analytics

This project uses Amplitude for tracking analytics events in both the frontend and backend.

### Frontend Analytics Setup

1. Sign up for an [Amplitude](https://amplitude.com/) account
2. Create a new project in Amplitude to get an API key
3. Add the API key to your `.env` file:
   ```
   VITE_AMPLITUDE_API_KEY=your-amplitude-api-key
   VITE_ENABLE_ANALYTICS=true
   ```
4. Test the analytics integration with the utility function:
   ```javascript
   import { testAmplitude } from '@shared/utils/testAnalytics';
   
   // Call this in your application to verify Amplitude setup
   testAmplitude();
   ```

### Backend Analytics Setup

1. Add the Amplitude API key to your Firebase Functions configuration:
   ```bash
   firebase functions:config:set amplitude.api_key=your-amplitude-api-key
   ```
2. For local development, update your local `.env.code-duels-89859` file:
   ```
   firebase functions:config:get > .env.code-duels-89859
   ```
3. The backend will automatically track important server-side events

### Tracked Events

The application tracks the following events:

#### Frontend Events
- Page views
- Button clicks
- Feature usage
- Authentication events

#### Backend Events
- Payment processing
- User role changes
- System operations

## Authentication & Security

The application implements a comprehensive authentication system with:
- Email/password authentication
- Guest access for limited features
- Role-based access control (admin, premium, regular users)
- Automatic token refresh for security
- Server-side verification of permissions

## Premium Features

Premium functionality is implemented using:
- Stripe payment processing
- Backend validation of premium status
- Restricted routes for premium users
- Enhanced UI for premium members

## Security Features

The application implements comprehensive security measures to protect user data and prevent common vulnerabilities:

### Authentication & Authorization
- JWT-based authentication with enhanced token refresh mechanisms
- Random jitter for token refreshes to mitigate timing attacks
- Role-based access control with server-side verification
- Complete session invalidation during logout (tokens, localStorage, sessionStorage, cookies)
- Rate limiting for sensitive operations (user role changes, login attempts)
- Guest user authentication with temporary sessions
- Secure profile update with proper re-authentication

### Data Protection
- Input validation across frontend and backend
- Secure client-side storage with encryption (CryptoJS)
- Expiration handling for stored items
- CORS protection with allowlisted origins

### API Security
- Strict parameter validation for all Firebase functions
- Detailed audit logging for security-critical actions
- Proper error handling that doesn't leak sensitive information

### Frontend Protections
- Content Security Policy (CSP) headers
- Protection against clickjacking (X-Frame-Options)
- Prevention of MIME type sniffing (X-Content-Type-Options)
- XSS protection headers
- HSTS for enforcing HTTPS
- Console logging prevention for sensitive information in production
- Secure analytics implementation that doesn't expose API keys

### Infrastructure
- Firebase Authentication for identity management
- Secure session management
- Environment variable protection for sensitive values

### Secure Logging
- Automatic disabling of console output in production environments
- No sensitive API keys or tokens are ever logged to the console
- Development-only debugging utilities
- Data sanitization for logging operations
- Protection against accidental exposure of credentials
- SecureLogger utility that only logs in development mode
- Automatic console method overriding in production

## Development vs Production

### Development Mode
- Enhanced logging for debugging with `SecureLogger`
- Detailed error messages
- Automatic reloading with Vite
- Access to development tools and utilities
- Run with `npm run dev`

### Production Mode
- No console logging (automatically disabled)
- Optimized bundle with code splitting
- Minified assets for performance
- Secure environment variables
- Build with `npm run build`
- Preview with `npm run preview`

## Dependencies

The project relies on the following key dependencies:

### Core Dependencies
- React 18+ with TypeScript
- React Router DOM for navigation
- Firebase SDK for authentication and database
- TanStack Query for data fetching
- Tailwind CSS with shadcn UI components
- CryptoJS for secure client-side encryption

### Development Dependencies
- Vite for fast development and optimized builds
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting

## EEG Integration

The application integrates with EEG hardware to provide real-time brain activity monitoring:

### Hardware Compatibility
- Support for consumer-grade EEG headsets (e.g., Muse, Emotiv)
- USB and Bluetooth connectivity options
- Automatic device detection and configuration

### Data Processing
- Real-time signal processing and filtering
- Artifact rejection algorithms
- Focus and cognitive load metrics
- Stress level indicators

### Visualization
- Real-time brain activity visualization
- Historical data comparison
- Cognitive metrics overlaid with coding activity
- Exportable session reports

### Privacy & Security
- Local processing of sensitive biometric data
- Opt-in data sharing for research
- Encrypted storage of EEG records
- Compliance with biometric data regulations

## Development Workflow

1. Run the frontend: `npm run dev`
2. Run the backend locally: `cd functions && npm run serve`
3. Start EEG server: `npm run eeg-server`
4. Deploy: `npm run build && firebase deploy`

## Import Aliases

The project uses the following import aliases:

- `@core/*` → `src/core/*`
- `@features/*` → `src/features/*`
- `@layouts/*` → `src/layouts/*`
- `@shared/*` → `src/shared/*`
- `@ui/*` → `src/ui/*`
- `@pages/*` → `src/pages/*`
- `@assets/*` → `src/assets/*` 