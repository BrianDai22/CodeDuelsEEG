/**
 * SecureLogging - Utility to ensure no sensitive information is logged to the console
 * 
 * This replaces the standard console methods to prevent accidental logging of 
 * sensitive information in production environments while maintaining developer 
 * debugging capabilities in development mode.
 */

// Check for development environment
const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV === true;

// For debugging - remove this after confirming environment detection works
console.warn(`Current environment: ${import.meta.env.MODE}, isDevelopment: ${isDevelopment}`);

interface SecureLoggerType {
  debug: (...args: any[]) => void;
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
}

/**
 * SecureLogger - Only logs in development mode
 */
export const SecureLogger: SecureLoggerType = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEV ONLY]', ...args);
    }
  },
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEV ONLY]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[DEV ONLY]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error('[DEV ONLY]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[DEV ONLY]', ...args);
    }
  }
};

/**
 * Utility to sanitize an object by removing sensitive fields
 * before logging for debugging purposes.
 */
export const sanitizeForLogging = <T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'key', 'secret', 'apiKey', 'credential', 'auth']
): Partial<T> => {
  if (!isDevelopment) {
    return {}; // Don't expose any data in production
  }
  
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      result[key as keyof T] = '[REDACTED]' as any;
      continue;
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key as keyof T] = sanitizeForLogging(value, sensitiveFields) as any;
    } else {
      result[key as keyof T] = value;
    }
  }
  
  return result;
};

/**
 * Override console methods in production to prevent accidental logging
 */
export const overrideConsoleInProduction = (): void => {
  // Force console.warn to show this message regardless of environment
  const originalWarn = console.warn;
  console.warn("Checking environment for console override:", import.meta.env.MODE, import.meta.env.DEV);
  
  // We directly check the environment here to ensure it's correctly evaluated
  if (import.meta.env.MODE === 'development' || import.meta.env.DEV === true) {
    console.warn("Development mode detected - keeping console methods intact");
    return; // Don't override in development
  }
  
  console.warn("Production mode detected - overriding console methods");
  
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: originalWarn,
    info: console.info,
    debug: console.debug,
  };
  
  // Override with empty functions in production
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  
  // Optional: provide a way to restore original console behavior
  // Used only for critical system errors that should be logged even in production
  (window as any).__restoreConsole = () => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
  };
}; 