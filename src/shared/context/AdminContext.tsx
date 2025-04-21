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
    const savedAdminMode = sessionStorage.getItem('adminMode') === 'true';
    setIsAdminMode(savedAdminMode && adminStatus);
    
    setLoading(false);
  }, [user, isAuthenticated]);

  // Verify admin status with backend
  const verifyAdminStatus = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const getAdminStatus = httpsCallable(functions, 'getUserRole');
      const result = await getAdminStatus({ role: 'isAdmin' });
      
      // Result is the truth about admin status from the server
      // @ts-ignore
      const hasAdminRole = result.data.hasRole === true;
      
      // Update local state to match server 
      setIsAdmin(hasAdminRole);
      
      return hasAdminRole;
    } catch (error) {
      console.error('Error verifying admin status:', error);
      toast.error('Error verifying admin status. Please try again.');
      return false;
    }
  };

  // Update admin mode UI preference (doesn't grant permissions)
  const handleSetIsAdminMode = (value: boolean): void => {
    // Can only set admin mode if actually an admin
    if (value && !isAdmin) {
      toast.error('You must be an admin to enable admin mode.');
      return;
    }
    
    setIsAdminMode(value);
    
    if (value) {
      sessionStorage.setItem('adminMode', 'true');
    } else {
      sessionStorage.removeItem('adminMode');
    }
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isAdminMode,
        loading,
        setIsAdminMode: handleSetIsAdminMode,
        setIsAdmin,
        verifyAdminStatus
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}; 