import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@features/auth/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { SecureLogger } from '@shared/utils/secureLogging';

// AdminContext is strictly a frontend concern - it doesn't make decisions
// about admin status, it only presents what the backend has determined
interface AdminContextType {
  isAdmin: boolean;
  isAdminMode: boolean;  // UI preference only
  loading: boolean;
  setIsAdminMode: (value: boolean) => void;
  setIsAdmin: (value: boolean) => void;
  verifyAdminStatus: () => Promise<boolean>; // New method to verify with backend
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const functions = getFunctions();

  // Load admin status when user changes - only trust the user.isAdmin from server
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      setIsAdminMode(false);
      sessionStorage.removeItem('adminMode');
      setLoading(false);
      return;
    }

    // Check if user is a guest
    if (user.id.startsWith('guest_')) {
      setIsAdmin(false);
      setIsAdminMode(false);
      sessionStorage.removeItem('adminMode');
      setLoading(false);
      return;
    }
    
    // Set admin status ONLY from user object (which comes from server verification)
    const adminStatus = user.isAdmin === true;    
    setIsAdmin(adminStatus);
    
    // Only a presentation preference, doesn't affect actual permissions
    const storedAdminMode = sessionStorage.getItem('adminMode');
    if (storedAdminMode) {
      const { isAdminMode: storedMode, userId } = JSON.parse(storedAdminMode);
      // Only apply stored admin mode if it belongs to the current user and they're an admin
      if (userId === user.id) {
        setIsAdminMode(storedMode && adminStatus);
      } else {
        // Clear stored admin mode if it belongs to a different user
        sessionStorage.removeItem('adminMode');
      }
    }
    
    setLoading(false);
  }, [user, isAuthenticated]);

  // Verify admin status directly with backend
  // This can be used for critical admin actions or page loads
  const verifyAdminStatus = async (): Promise<boolean> => {
    if (!user || !user.email) {
      return false;
    }

    try {
      setLoading(true);
      const getUserRole = httpsCallable<any, { isAdmin: boolean; isPremium: boolean }>(
        functions, 
        'getUserRole'
      );
      
      // Backend verifies admin status directly - no email needed since auth is used
      const result = await getUserRole({});
      
      const verified = result.data.isAdmin === true;
      
      // If the backend says something different than what we have, refresh user
      if (verified !== isAdmin) {
        await refreshUser();
      }
      
      return verified;
    } catch (error) {
      // Silent error handling
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Custom setter for admin mode that persists to sessionStorage - UI preference only
  const handleSetAdminMode = (value: boolean) => {
    if (!isAuthenticated || !user || user.id.startsWith('guest_') || !isAdmin) {
      setIsAdminMode(false);
      sessionStorage.removeItem('adminMode');
      return;
    }

    setIsAdminMode(value);
    
    // Save admin mode preference to sessionStorage
    if (value) {
      sessionStorage.setItem('adminMode', JSON.stringify({
        isAdminMode: value,
        userId: user.id
      }));
    } else {
      sessionStorage.removeItem('adminMode');
    }
  };

  // Custom setter for admin status that uses backend Cloud Function
  const handleSetAdmin = async (value: boolean) => {
    if (!isAuthenticated || !user || user.id.startsWith('guest_')) {
      setIsAdmin(false);
      return;
    }

    try {
      // Call the Cloud Function to update admin status securely
      const setUserAdminStatus = httpsCallable(
        functions, 
        'setUserAdminStatus'
      );
      
      const result = await setUserAdminStatus({
        userId: user.id,
        isAdmin: value
      });
      
      // Update local state only after backend confirms change
      const response = result.data as { success: boolean; message: string };
      
      if (response.success) {
        // Refresh user to get latest roles from backend
        await refreshUser();
        toast.success(response.message);
        
        // Clear admin mode if admin status is turned off
        if (!value) {
          setIsAdminMode(false);
          sessionStorage.removeItem('adminMode');
        }
      } else {
        toast.error('Failed to update admin status');
      }
    } catch (error: any) {
      // Show error toast but don't log details
      toast.error('Failed to update admin status');
    }
  };

  const value = {
    isAdmin,
    isAdminMode,
    loading,
    setIsAdmin: handleSetAdmin,
    setIsAdminMode: handleSetAdminMode,
    verifyAdminStatus
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 