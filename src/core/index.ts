/**
 * Core Module
 * 
 * Provides core functionality for the application, including authentication,
 * providers, and configuration.
 */

// Re-export from submodules
export * from './auth';
export * from './providers';

// Export firebase configuration
export { auth, database } from './firebase'; 