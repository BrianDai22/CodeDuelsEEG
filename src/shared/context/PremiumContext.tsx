import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@features/auth/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';

// PremiumContext is strictly a frontend concern - it doesn't make decisions
// about premium status, it only presents what the backend has determined
interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  setPremium: (value: boolean) => void;
  verifyPremiumStatus: () => Promise<boolean>; // New method to verify with backend
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const functions = getFunctions();

  // Load premium status from server on mount and when user changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    // Check if user is a guest
    if (user.id.startsWith('guest_')) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    // Set premium status ONLY from user object (which comes from server verification)
    const premiumStatus = user.isPremium === true;
    setIsPremium(premiumStatus);
    setLoading(false);
  }, [user, isAuthenticated]);

  // Verify premium status directly with backend
  // This can be used for critical premium features or page loads
  const verifyPremiumStatus = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const getPremiumStatus = httpsCallable(functions, 'getUserRole');
      const result = await getPremiumStatus({ role: 'isPremium' });
      
      // @ts-ignore
      const hasPremiumRole = result.data.hasRole === true;
      
      // Update local state to match server
      setIsPremium(hasPremiumRole);
      
      return hasPremiumRole;
    } catch (error) {
      console.error('Error verifying premium status:', error);
      toast.error('Error verifying premium status. Please try again.');
      return false;
    }
  };

  // Custom setter for premium status that uses backend Cloud Function
  const handleSetPremium = async (value: boolean) => {
    if (!isAuthenticated || !user || user.id.startsWith('guest_')) {
      setIsPremium(false);
      return;
    }

    try {
      // Call the Cloud Function to update premium status securely
      const setUserPremiumStatus = httpsCallable(
        functions, 
        'setUserPremiumStatus'
      );
      
      const result = await setUserPremiumStatus({
        userId: user.id,
        isPremium: value
      });
      
      // Update local state only after backend confirms change
      const response = result.data as { success: boolean; message: string };
      
      if (response.success) {
        // Refresh user to get latest roles from backend
        await refreshUser();
        toast.success(response.message);
      } else {
        toast.error('Failed to update premium status');
      }
    } catch (error: any) {
      // Show error toast but don't log details
      toast.error('Failed to update premium status');
    }
  };

  const value = {
    isPremium,
    loading,
    setPremium: handleSetPremium,
    verifyPremiumStatus
  };

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}; 