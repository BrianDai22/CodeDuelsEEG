import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth';

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  setPremium: (value: boolean) => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load premium status from localStorage on mount and when user changes
  useEffect(() => {
    console.log('PremiumContext useEffect triggered', { 
      isAuthenticated, 
      userId: user?.id, 
      userEmail: user?.email,
      userPremium: user?.isPremium
    });

    if (!isAuthenticated || !user) {
      console.log('PremiumContext: No authenticated user, resetting premium status');
      setIsPremium(false);
      setLoading(false);
      return;
    }

    // Check if user is a guest
    if (user.id.startsWith('guest_')) {
      console.log('PremiumContext: Guest user detected, cannot have premium status');
      setIsPremium(false);
      setLoading(false);
      return;
    }

    // Get stored profile
    const storedProfile = localStorage.getItem('userProfile');
    console.log('PremiumContext: Stored profile from localStorage', storedProfile);
    const profile = storedProfile ? JSON.parse(storedProfile) : {};
    
    // Set premium status from user object first, then from profile
    const premiumStatus = user.isPremium === true || profile.isPremium === true;
    console.log('PremiumContext: Setting premium status to', premiumStatus, {
      userIsPremium: user.isPremium,
      profileIsPremium: profile.isPremium
    });
    
    setIsPremium(premiumStatus);
    setLoading(false);
  }, [user, isAuthenticated]);

  // Custom setter for premium status that updates profile
  const handleSetPremium = async (value: boolean) => {
    if (!isAuthenticated || !user || user.id.startsWith('guest_')) {
      setIsPremium(false);
      return;
    }

    setIsPremium(value);
    
    // Update user profile in localStorage
    const storedProfile = localStorage.getItem('userProfile');
    const profile = storedProfile ? JSON.parse(storedProfile) : {};
    
    const updatedProfile = {
      ...profile,
      isPremium: value // Explicitly set the premium status
    };
    
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  };

  const value = {
    isPremium,
    loading,
    setPremium: handleSetPremium,
  };

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
} 