/**
 * Secure storage utilities to handle client-side storage in a safer manner
 * with appropriate encryption and data protection.
 */

import CryptoJS from 'crypto-js';

// Secret key derived from app information
// In production, this would use a more secure approach
const getStorageKey = (): string => {
  const domain = window.location.host;
  const appName = 'CodeDuels';
  return `${appName}-${domain}-secure`;
};

interface StoredItem {
  data: any;
  expires?: number;
  created: number;
}

/**
 * Securely stores a value in sessionStorage with optional expiration
 * 
 * @param key - Storage key
 * @param value - Value to store
 * @param expiresInMinutes - Optional expiration in minutes
 */
export function secureSessionStore(key: string, value: any, expiresInMinutes?: number): void {
  if (!key) return;
  
  try {
    const storageKey = getStorageKey();
    const item: StoredItem = {
      data: value,
      created: Date.now()
    };
    
    if (expiresInMinutes) {
      item.expires = Date.now() + (expiresInMinutes * 60 * 1000);
    }
    
    const serialized = JSON.stringify(item);
    const encrypted = CryptoJS.AES.encrypt(serialized, storageKey).toString();
    
    sessionStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Failed to store data securely:', error);
    // Fallback to standard storage in case of error
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (fallbackError) {
      console.error('Failed to use fallback storage:', fallbackError);
    }
  }
}

/**
 * Retrieves a securely stored value from sessionStorage
 * 
 * @param key - Storage key
 * @returns The stored value or null if expired/invalid
 */
export function secureSessionGet<T>(key: string): T | null {
  if (!key) return null;
  
  try {
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;
    
    const storageKey = getStorageKey();
    
    // Try to decrypt with secure key
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, storageKey).toString(CryptoJS.enc.Utf8);
      if (!decrypted) return null;
      
      const item: StoredItem = JSON.parse(decrypted);
      
      // Check if the item has expired
      if (item.expires && item.expires < Date.now()) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return item.data as T;
    } catch (decryptError) {
      // If decryption fails, it might be stored in plaintext (from before)
      try {
        return JSON.parse(encrypted) as T;
      } catch {
        return null;
      }
    }
  } catch (error) {
    console.error('Failed to retrieve secure data:', error);
    return null;
  }
}

/**
 * Removes a securely stored value from sessionStorage
 * 
 * @param key - Storage key to remove
 */
export function secureSessionRemove(key: string): void {
  if (!key) return;
  sessionStorage.removeItem(key);
}

/**
 * Clears all session data
 */
export function clearAllSessionData(): void {
  try {
    sessionStorage.clear();
    localStorage.clear();
    
    // Also try to clear any cookies by setting expirations in the past
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    console.log('All session data cleared');
  } catch (error) {
    console.error('Failed to clear all session data:', error);
  }
} 