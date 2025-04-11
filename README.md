# Code Duels EEG

A competitive coding platform where developers can battle in real-time coding challenges.

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