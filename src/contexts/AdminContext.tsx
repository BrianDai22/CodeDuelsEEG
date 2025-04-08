import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserProfile } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AUTHORIZED_ADMIN_EMAILS } from '@/lib/api';

interface AdminContextType {
  isAdmin: boolean;
  isAdminMode: boolean;
  setIsAdminMode: (value: boolean) => void;
  setIsAdmin: (value: boolean) => void;
  loading: boolean;
  isPremium: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Load admin status from localStorage on mount and when user changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      setIsAdminMode(false);
      setIsPremium(false);
      localStorage.removeItem('adminMode');
      setLoading(false);
      return;
    }

    // Check if user is a guest
    if (user.id.startsWith('guest_')) {
      setIsAdmin(false);
      setIsAdminMode(false);
      setIsPremium(false);
      localStorage.removeItem('adminMode');
      setLoading(false);
      return;
    }

    // Get stored profile
    const storedProfile = localStorage.getItem('userProfile');
    const profile = storedProfile ? JSON.parse(storedProfile) : {};
    
    // Only set admin status from profile, don't override with email check
    setIsAdmin(profile.isAdmin || false);
    
    // Set premium status
    setIsPremium(profile.isPremium || profile.isAdmin || false);
    
    // Load admin mode from localStorage
    const storedAdminMode = localStorage.getItem('adminMode');
    if (storedAdminMode) {
      const { isAdminMode: storedMode, userId } = JSON.parse(storedAdminMode);
      // Only apply stored admin mode if it belongs to the current user
      if (userId === user.id) {
        setIsAdminMode(storedMode && profile.isAdmin);
      } else {
        // Clear stored admin mode if it belongs to a different user
        localStorage.removeItem('adminMode');
      }
    }
    
    setLoading(false);
  }, [user, isAuthenticated]);

  // Custom setter for admin mode that persists to localStorage
  const handleSetAdminMode = (value: boolean) => {
    if (!isAuthenticated || !user || user.id.startsWith('guest_')) {
      setIsAdminMode(false);
      localStorage.removeItem('adminMode');
      return;
    }

    setIsAdminMode(value);
    
    // Save admin mode preference to localStorage
    if (value) {
      localStorage.setItem('adminMode', JSON.stringify({
        isAdminMode: value,
        userId: user.id
      }));
    } else {
      localStorage.removeItem('adminMode');
    }
  };

  // Custom setter for admin status that updates profile
  const handleSetAdmin = async (value: boolean) => {
    if (!isAuthenticated || !user || user.id.startsWith('guest_')) {
      setIsAdmin(false);
      return;
    }

    setIsAdmin(value);
    
    // Update user profile in localStorage
    const storedProfile = localStorage.getItem('userProfile');
    const profile = storedProfile ? JSON.parse(storedProfile) : {};
    
    const updatedProfile = {
      ...profile,
      isAdmin: value, // Explicitly set the admin status
      isPremium: value ? true : profile.isPremium // Ensure admin users have premium access
    };
    
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    
    // Update premium status
    setIsPremium(updatedProfile.isPremium);
    
    // Clear admin mode if admin status is turned off
    if (!value) {
      setIsAdminMode(false);
      localStorage.removeItem('adminMode');
    }
  };

  const value = {
    isAdmin,
    isAdminMode,
    setIsAdmin: handleSetAdmin,
    setIsAdminMode: handleSetAdminMode,
    loading,
    isPremium
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