# Migration Plan: Feature-First Architecture

This document outlines the steps to complete the migration from the current directory structure to a more maintainable feature-first architecture.

## New Structure Overview

```
src/
├── features/           # Feature-based organization (primary)
│   ├── auth/           # Authentication feature
│   ├── arena/          # Battle arena feature
│   ├── leaderboard/    # Leaderboard feature
│   ├── profile/        # User profile & history
│   └── premium/        # Premium subscription feature
├── shared/             # Shared code between features
│   ├── components/     # Shared UI components
│   ├── hooks/          # Shared custom hooks
│   ├── context/        # Global state providers
│   ├── lib/            # Utility functions & services
│   └── types/          # TypeScript type definitions
├── ui/                 # Base UI components (shadcn/ui)
├── pages/              # Simple pages not tied to a feature
├── App.tsx             # Root component
└── main.tsx            # Application entry point
```

## Migration Steps

### 1. Implemented Changes

- ✅ Created the directory structure
- ✅ Copied files to their new locations 
- ✅ Updated path aliases in vite.config.ts and tsconfig files
- ✅ Created index files for easier exports/imports
- ✅ Updated App.tsx with imports from the new structure

### 2. Remaining Tasks

1. **Update Component Imports**
   - Update imports in each component file to reference the new paths (using the new path aliases)
   - Use imports from index files where possible for cleaner code (e.g., `@features/auth` instead of `@features/auth/components/ProtectedRoute`)

2. **Cleanup Original Files**
   - After confirming the app works with the new structure, remove the original files and directories

3. **Update Tests (if any)**
   - Update import paths in test files 

4. **Documentation**
   - Update any documentation to reflect the new structure
   - Add comments to index files to explain file organization

### 3. How to Use the New Structure

#### For New Features:

1. Create a new directory in `features/` named after your feature
2. Create subdirectories: `components/`, `hooks/`, `pages/`, etc.
3. Add an `index.ts` file to export your feature's public API
4. Import from feature folders using the pattern:
   ```typescript
   import { ComponentName } from '@features/feature-name';
   ```

#### For Shared Code:

1. Place truly reusable code in `shared/` 
2. Use the pattern:
   ```typescript
   import { UtilityName } from '@shared/lib';
   ```

#### For UI Components:

1. Use the UI components from the `ui/` directory:
   ```typescript
   import { Button, Input } from '@ui';
   ```

## Benefits of New Structure

- **Feature-First**: Code is organized around business domains, not technical concerns
- **Colocation**: Related code is kept together, making it easier to understand and modify features
- **Discoverability**: Clear directory names make it obvious where to find things
- **Scalability**: Easy to add new features without cluttering the codebase
- **Modularity**: Features can be added or removed with minimal impact on the rest of the codebase 