# Frontend Organization

This document outlines the organization of the frontend codebase for the Code Duels EEG project.

## Directory Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Page components corresponding to routes
- `src/features/` - Feature-based modules
- `src/layouts/` - Layout components used across pages
- `src/lib/` - Core application infrastructure
- `src/utils/` - Shared utility functions
- `src/hooks/` - Custom React hooks
- `src/styles/` - Global styles and Tailwind configuration
- `src/assets/` - Static assets like images and fonts
- `src/eeg/` - EEG integration modules and utilities

```
src/
├── assets/           # Static assets (images, fonts, etc.)
├── core/             # Application core
│   ├── auth/         # Authentication context, providers, hooks
│   ├── providers/    # Global providers
│   └── firebase.ts   # Firebase configuration
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
│   ├── hooks/        # Custom hooks
│   └── utils/        # Utility functions
├── ui/               # UI component library
├── App.tsx           # Application entry component
├── main.tsx          # Application bootstrap
└── index.css         # Global styles
```

## Key Concepts

### Core

The `core` directory contains essential application infrastructure that isn't tied to specific features:

- **auth**: Authentication context and hooks
- **providers**: Global context providers (Admin, Premium, Analytics)

### Features

The `features` directory uses a feature-based organization pattern:

- Each feature has its own directory (admin, arena, auth, etc.)
- Features contain their own components, pages, hooks, etc.
- Features export their public API via index.ts

### Layouts

The `layouts` directory contains structural components used across the application:

- **headers**: Various header components (User, Guest, Premium, etc.)
- **footers**: Footer components

### Shared

The `shared` directory contains utilities and helpers used throughout the application:

- **api**: API utilities and service functions
- **hooks**: Shared custom hooks
- **utils**: General utility functions, including:
  - `secureLogging.ts`: Development-only logging system that prevents exposing sensitive information in production
  - `secureStorage.ts`: Encrypted client-side storage for sensitive data using CryptoJS
  - `testAnalytics.js`: Utility to verify Amplitude analytics integration

### Pages

The `pages` directory contains standalone page components that don't belong to a specific feature.

## Import Aliases

Path aliases have been configured to make imports more readable:

- `@core/*` → `src/core/*`
- `@features/*` → `src/features/*`
- `@layouts/*` → `src/layouts/*`
- `@shared/*` → `src/shared/*`
- `@ui/*` → `src/ui/*`
- `@pages/*` → `src/pages/*`
- `@assets/*` → `src/assets/*`

## Features

### Auth
Components and utilities related to authentication flow.

### Dashboard
User dashboard, statistics, and profile management.

### Challenges
Coding challenge interfaces, including editor, test runner, and results view.

### Subscriptions
Premium feature management and subscription handling.

### Admin
Admin-only interfaces for challenge management and user oversight.

### EEG
EEG hardware integration and brain activity monitoring:

- `eeg/devices/` - Device-specific connection and configuration handlers
- `eeg/processing/` - Signal processing algorithms and data transformation
- `eeg/visualizations/` - Charts, heatmaps, and interactive visualizations
- `eeg/hooks/` - Custom hooks for EEG data access and state management
- `eeg/utils/` - Helper functions for EEG data analysis
- `eeg/components/` - Reusable UI components for EEG visualization
- `eeg/types/` - TypeScript interfaces and type definitions for EEG data

## Pages

The application routes are organized into the following pages:

- `/` - Landing page
- `/login` - Authentication
- `/dashboard` - User dashboard
- `/challenges` - Challenge listing
- `/challenge/:id` - Individual challenge
- `/profile` - User profile
- `/leaderboard` - Global and challenge-specific leaderboards
- `/admin/*` - Admin portal routes
- `/settings` - User settings
- `/subscription` - Subscription management
- `/eeg` - EEG setup and configuration
- `/eeg/visualize` - EEG visualization dashboard
- `/eeg/history` - Historical EEG session data

## Shared Utilities

The `shared` directory contains utilities and helpers used throughout the application:

- **api**: API utilities and service functions
- **hooks**: Shared custom hooks
- **utils**: General utility functions, including:
  - `secureLogging.ts`: Development-only logging system that prevents exposing sensitive information in production
  - `secureStorage.ts`: Encrypted client-side storage for sensitive data using CryptoJS
  - `testAnalytics.js`: Utility to verify Amplitude analytics integration

## Core Authentication

The authentication system (`core/auth`) provides:

- Email/password authentication
- Guest user support with temporary sessions
- Admin and premium user role management
- Secure profile updates with proper re-authentication
- Complete session invalidation during logout
- Persistent login state with secure storage

### AuthContext

The `AuthContext` provides a complete authentication interface:

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUserProfile: (data: { 
    username?: string; 
    email?: string; 
    currentPassword?: string; 
    newPassword?: string;
    photoURL?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}
```

## Security Features

### SecureLogger

The `SecureLogger` utility provides development-only logging:

```typescript
// In development, messages appear in console
SecureLogger.log("Debugging info");
SecureLogger.error("Error details");

// In production, all logs are suppressed
```

### SecureStorage

The `secureStorage` utilities provide encrypted client-side storage:

```typescript
// Store data securely with optional expiration
secureSessionStore("userPrefs", { theme: "dark" }, 60); // Expires in 60 minutes

// Retrieve data
const prefs = secureSessionGet("userPrefs");

// Remove data
secureSessionRemove("userPrefs");

// Clear all session data on logout
clearAllSessionData();
```

## Development and Production

The application automatically detects the current environment:

- Development mode provides enhanced debugging and logging
- Production mode automatically disables console output
- Environment-specific configuration is managed via `.env` variables

### Building for Production

To build for production:
1. Run `npm run build`
2. Preview with `npm run preview`
3. All debugging output is automatically suppressed 