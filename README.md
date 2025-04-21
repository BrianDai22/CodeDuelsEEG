# CodeDuels

CodeDuels is an interactive coding battle platform where users can compete in real-time coding challenges.

## Integrated Branch

This branch integrates features from both the `matchmaking` and `security-and-roles` branches to provide a complete experience with both multiplayer capabilities and security features.

### Key Features

- **Real-time Coding Battles**: Compete against other users in real-time coding challenges
- **Advanced Code Editor**: Monaco Editor integration for a professional coding experience
- **Secure Authentication**: Role-based access control for premium and admin features
- **Multiplayer Matchmaking**: Find other players and battle in real-time
- **Premium Features**: Exclusive features for premium subscribers
- **Admin Dashboard**: Administrative tools for managing the platform

## Setup and Development

### Prerequisites

- Node.js 16+
- Firebase account
- Supabase account (for matchmaking features)
- Stripe account (for premium subscriptions)

### Environment Setup

1. Clone the repository
2. Create a `.env` file with all required variables (see `.env.example`)
3. Install dependencies with `npm install`
4. Run the development server with `npm run dev`

### Environment Variables

The integrated branch requires both Firebase and Supabase configuration:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_DATABASE_URL=

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_SECRET_KEY=
VITE_STRIPE_PRICE_ID=
VITE_FIREBASE_FUNCTION_URL=
VITE_APP_URL=

# Supabase Configuration
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_SERVICE_ROLE_KEY=

# Amplitude Analytics
VITE_AMPLITUDE_API_KEY=
VITE_ENABLE_ANALYTICS=true
```

## Security Features

- **Role-based Access Control**: Secure routes based on user roles
- **Backend Verification**: Critical operations verified on the server
- **Secure Logging**: Prevents sensitive information from being logged in production

## Matchmaking Features

- **Multiplayer Lobbies**: Create and join lobbies for coding battles
- **Real-time Updates**: Live opponent status and progress
- **Coding Problems**: Curated problems with test cases and validation

## Testing

See the `TESTING.md` file for a detailed testing plan to ensure all features work correctly together.

## Project Structure

```
CodeDuelsEEG/
├── src/                    # Frontend source code
│   ├── features/           # Feature-based organization (primary)
│   │   ├── auth/           # Authentication feature
│   │   │   ├── components/ # Components specific to auth
│   │   │   ├── hooks/      # Hooks specific to auth
│   │   │   └── pages/      # Auth pages
│   │   ├── arena/          # Battle arena feature
│   │   ├── leaderboard/    # Leaderboard feature
│   │   ├── profile/        # User profile & history
│   │   └── premium/        # Premium subscription feature
│   ├── shared/             # Shared code between features
│   │   ├── components/     # Shared UI components
│   │   ├── hooks/          # Shared custom hooks
│   │   ├── context/        # Global state providers
│   │   ├── lib/            # Utility functions & services
│   │   └── types/          # TypeScript type definitions
│   ├── ui/                 # Base UI components (shadcn/ui)
│   ├── App.tsx             # Root component
│   └── main.tsx            # Application entry point
├── functions/              # Firebase Cloud Functions (backend)
│   ├── src/                # Backend source code
│   │   ├── controllers/    # API request handlers
│   │   ├── services/       # Business logic
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utility functions
│   └── index.js            # Backend entry point
├── public/                 # Static assets
├── config/                 # Project configuration
├── index.html              # HTML entry point
└── [other config files]    # Various config files
```

## Technologies

- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Firebase Cloud Functions, Realtime Database
- **Authentication**: Firebase Authentication
- **Payments**: Stripe

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v8+)
- Firebase CLI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/CodeDuelsEEG.git
   cd CodeDuelsEEG
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd functions
   npm install
   cd ..
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required values
   - Set up Firebase config: `firebase functions:config:set stripe.secret_key=sk_... app.url=http://localhost:5173`

### Development

1. Start the frontend development server:
   ```bash
   npm run dev
   ```

2. Start the Firebase emulators:
   ```bash
   cd functions
   npm run serve
   ```

### Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Features

- Real-time coding battles
- Premium subscription management
- Leaderboard ranking
- Match history tracking
- User authentication and profiles

## Documentation

- See `FIREBASE_SETUP.md` for Firebase configuration
- See `ANALYTICS.md` for analytics setup and tracking

## Development Guidelines

1. Place new pages in the appropriate subdirectory under `src/frontend/pages/`
2. Add reusable components to `src/frontend/components/common/`
3. Feature-specific components go in `src/frontend/components/features/`
4. Backend endpoints should be organized by feature in `functions/src/controllers/`