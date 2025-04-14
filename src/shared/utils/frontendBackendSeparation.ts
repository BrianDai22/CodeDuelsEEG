/**
 * Frontend/Backend Separation Utilities and Guidelines
 * 
 * This file contains utilities and guidelines for maintaining proper
 * separation between frontend and backend concerns in our application.
 * 
 * GUIDELINES:
 * 
 * 1. Frontend responsibilities:
 *    - User interface presentation
 *    - Form input collection and validation
 *    - Routing and navigation
 *    - Client-side state management
 *    - User interactions and events
 * 
 * 2. Backend responsibilities:
 *    - Data validation and sanitization
 *    - Business logic and rules
 *    - Authentication and authorization
 *    - Data storage and retrieval
 *    - Security enforcement
 * 
 * 3. Communication patterns:
 *    - Frontend calls backend through well-defined API endpoints
 *    - Backend returns data, not UI components or presentation logic
 *    - Frontend never assumes role/permission status without backend verification
 *    - Frontend gracefully handles backend errors and presents user-friendly messages
 */

import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { toast } from 'sonner';

/**
 * Type-safe wrapper for calling Firebase functions
 * Ensures proper typing of parameters and return values
 */
export function callBackendFunction<T, R>(
  functionName: string, 
  data: T,
  errorMessage: string = 'Backend operation failed'
): Promise<R> {
  const functions = getFunctions();
  const backendFunction = httpsCallable<T, R>(functions, functionName);
  
  return backendFunction(data)
    .then((result: HttpsCallableResult<R>) => {
      return result.data;
    })
    .catch((error) => {
      console.error(`Error calling ${functionName}:`, error);
      throw new Error(errorMessage);
    });
}

/**
 * Secure utility for verifying specific roles/permissions with the backend
 * before performing sensitive operations.
 * 
 * @param functionName - The Firebase Cloud Function to call
 * @param roleProperty - The property in the result to check (e.g., 'isAdmin', 'isPremium')
 * @param payload - Optional payload to send to the function
 * @returns Promise<boolean> - Whether the user has the requested permission
 */
export async function verifyBackendRole(
  functionName: string,
  roleProperty: 'isAdmin' | 'isPremium',
  payload?: any
): Promise<boolean> {
  try {
    const functions = getFunctions();
    const callFunction = httpsCallable(functions, functionName);
    
    // Call backend function with optional payload
    const result = await callFunction(payload || {});
    
    // Check if the requested role property exists and is true
    if (result.data && typeof result.data === 'object') {
      return (result.data as any)[roleProperty] === true;
    }
    
    return false;
  } catch (error: any) {
    console.error(`Error verifying ${roleProperty} status:`, error);
    toast.error(`Security verification failed: ${error.message || 'Unknown error'}`);
    return false;
  }
}

/**
 * Secure execution of a sensitive function that requires specific permissions.
 * This ensures the operation is only performed if the user has verified permissions.
 * 
 * @param operation - Function to execute if permission check passes
 * @param permissionType - Type of permission needed ('admin' or 'premium')
 * @param errorMessage - Custom error message if permission check fails
 * @returns Promise<T | null> - Result of operation or null if unauthorized
 */
export async function secureOperation<T>(
  operation: () => Promise<T>,
  permissionType: 'admin' | 'premium',
  errorMessage = 'You don\'t have permission to perform this action'
): Promise<T | null> {
  try {
    // Determine which role property to check based on permission type
    const roleProperty = permissionType === 'admin' ? 'isAdmin' : 'isPremium';
    
    // Verify with backend before proceeding
    const hasPermission = await verifyBackendRole('getUserRole', roleProperty);
    
    if (!hasPermission) {
      toast.error(errorMessage);
      return null;
    }
    
    // Execute the operation only if permission check passes
    return await operation();
  } catch (error: any) {
    console.error(`Error in secure operation (${permissionType}):`, error);
    toast.error(`Operation failed: ${error.message || 'Unknown error'}`);
    return null;
  }
}

/**
 * Logs sensitive operations for audit purposes.
 * 
 * @param operationType - Type of operation being performed
 * @param details - Details about the operation
 */
export function auditLog(operationType: string, details: Record<string, any>): void {
  // In a production environment, this would send data to a secure logging service
  console.log(`[AUDIT] ${operationType}:`, details);
  
  // This could be expanded to call a Cloud Function that records
  // the audit log in a secure, tamper-evident database
}

/**
 * Data mutation helper that enforces backend validation
 */
export async function mutateWithBackendValidation<T, R>(
  functionName: string,
  data: T,
  successCallback?: (result: R) => void,
  errorCallback?: (error: Error) => void
): Promise<R | null> {
  try {
    const result = await callBackendFunction<T, R>(functionName, data);
    if (successCallback) successCallback(result);
    return result;
  } catch (error) {
    const typedError = error instanceof Error ? error : new Error('Unknown error');
    if (errorCallback) errorCallback(typedError);
    return null;
  }
} 