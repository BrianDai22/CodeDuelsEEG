import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth';

interface AdminContextType {
  isAdmin: boolean;
  isAdminMode: boolean;
  loading: boolean;
  setIsAdminMode: (value: boolean) => void;
  setIsAdmin: (value: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load admin status from localStorage on mount and when user changes
  useEffect(() => {
    console.log('AdminContext useEffect triggered', { 
      isAuthenticated, 
      userId: user?.id, 
      userEmail: user?.email,
      userAdmin: user?.isAdmin
    });

    if (!isAuthenticated || !user) {
      console.log('AdminContext: No authenticated user, resetting admin status');
      setIsAdmin(false);
      setIsAdminMode(false);
      localStorage.removeItem('adminMode');
      setLoading(false);
      return;
    }

    // Check if user is a guest
    if (user.id.startsWith('guest_')) {
      console.log('AdminContext: Guest user detected, cannot be admin');
      setIsAdmin(false);
      setIsAdminMode(false);
      localStorage.removeItem('adminMode');
      setLoading(false);
      return;
    }

    // Get stored profile
    const storedProfile = localStorage.getItem('userProfile');
    console.log('AdminContext: Stored profile from localStorage', storedProfile);
    const profile = storedProfile ? JSON.parse(storedProfile) : {};
    
    // Set admin status directly from user object first, then from profile
    const adminStatus = user.isAdmin === true || profile.isAdmin === true;
    console.log('AdminContext: Setting admin status to', adminStatus, {
      userIsAdmin: user.isAdmin,
      profileIsAdmin: profile.isAdmin
    });
    
    setIsAdmin(adminStatus);
    
    // Load admin mode from localStorage
    const storedAdminMode = localStorage.getItem('adminMode');
    if (storedAdminMode) {
      const { isAdminMode: storedMode, userId } = JSON.parse(storedAdminMode);
      // Only apply stored admin mode if it belongs to the current user and they're an admin
      if (userId === user.id) {
        setIsAdminMode(storedMode && adminStatus);
      } else {
        // Clear stored admin mode if it belongs to a different user
        localStorage.removeItem('adminMode');
      }
    }
    
    setLoading(false);
  }, [user, isAuthenticated]);

  // Custom setter for admin mode that persists to localStorage
  const handleSetAdminMode = (value: boolean) => {
    if (!isAuthenticated || !user || user.id.startsWith('guest_') || !isAdmin) {
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
      isAdmin: value // Explicitly set the admin status
    };
    
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    
    // Clear admin mode if admin status is turned off
    if (!value) {
      setIsAdminMode(false);
      localStorage.removeItem('adminMode');
    }
  };

  const value = {
    isAdmin,
    isAdminMode,
    loading,
    setIsAdmin: handleSetAdmin,
    setIsAdminMode: handleSetAdminMode,
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