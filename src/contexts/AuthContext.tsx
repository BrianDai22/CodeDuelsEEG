import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  signInAnonymously,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { ref, set, get, child } from 'firebase/database';
import { auth, database } from '@/config/firebase';
import { createUserProfile, updateUserProfile as updateApiUserProfile } from '@/lib/api';
import { AUTHORIZED_ADMIN_EMAILS, AUTHORIZED_PREMIUM_EMAILS } from '@/lib/api';

export interface User {
  id: string;
  uid: string;
  email: string | null;
  username: string;
  createdAt: string;
  photoURL?: string;
  displayName: string | null;
  isAdmin?: boolean;
  isPremium?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUserProfile: (data: { 
    username?: string; 
    email?: string; 
    currentPassword?: string; 
    newPassword?: string;
    photoURL?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Helper function to ensure premium status is maintained
  const ensurePremiumStatus = (userData: User | null): User | null => {
    if (!userData) return null;
    
    // Check localStorage for premium status
    const userProfile = localStorage.getItem('userProfile');
    let isPremium = false;
    let isAdmin = false;
    
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      isPremium = profile.isPremium || false;
      isAdmin = profile.isAdmin || false;
    }
    
    // Return updated user object with preserved premium status
    return {
      ...userData,
      isPremium: isPremium || userData.isPremium || false,
      isAdmin: isAdmin || userData.isAdmin || false
    };
  };

  // Convert Firebase user to our User type
  const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    try {
      // Get user data from database
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val() || {};
      
      // Get stored profile from localStorage
      const storedProfile = localStorage.getItem('userProfile');
      const profile = storedProfile ? JSON.parse(storedProfile) : {};
      
      // Check if user is in authorized lists
      const isAuthorizedAdmin = AUTHORIZED_ADMIN_EMAILS.includes(firebaseUser.email || '');
      const isAuthorizedPremium = AUTHORIZED_PREMIUM_EMAILS.includes(firebaseUser.email || '');
      
      // Prioritize stored profile photoURL over Firebase photoURL
      const photoURL = profile.photoURL || firebaseUser.photoURL || userData.photoURL || '';
      
      // Create user object with premium status and preserved profile data
      const user: User = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        username: userData.username || firebaseUser.displayName || profile.displayName || '',
        createdAt: userData.createdAt || new Date().toISOString(),
        photoURL: photoURL,
        displayName: firebaseUser.displayName || profile.displayName || '',
        isAdmin: profile.isAdmin || isAuthorizedAdmin || false,
        isPremium: profile.isPremium || isAuthorizedAdmin || isAuthorizedPremium || false
      };
      
      // Save the updated profile to localStorage, preserving the photoURL
      localStorage.setItem('userProfile', JSON.stringify({
        ...profile,
        ...user,
        photoURL: photoURL // Ensure photoURL is preserved
      }));
      
      return user;
    } catch (error) {
      console.error('Error converting Firebase user:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await convertFirebaseUser(firebaseUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Create or update user profile with premium status if authorized
        try {
          console.log('Creating/updating user profile for:', userData.email);
          
          // Check if user profile exists
          const storedProfile = localStorage.getItem('userProfile');
          if (!storedProfile) {
            // Create new profile
            console.log('Creating new user profile');
            await createUserProfile({
              photoURL: userData.photoURL || '',
              displayName: userData.username || '',
              email: userData.email || ''
            });
          } else {
            // Update existing profile
            console.log('Updating existing user profile');
            const profile = JSON.parse(storedProfile);
            
            // Check if email is in authorized lists
            const isAuthorizedAdmin = AUTHORIZED_ADMIN_EMAILS.includes(userData.email || '');
            const isAuthorizedPremium = AUTHORIZED_PREMIUM_EMAILS.includes(userData.email || '');
            
            // Update profile with premium status using the API function
            await updateApiUserProfile({
              photoURL: userData.photoURL || profile.photoURL || '',
              email: userData.email || profile.email || '',
              isAdmin: isAuthorizedAdmin,
              isPremium: isAuthorizedAdmin || isAuthorizedPremium
            });
          }
        } catch (error) {
          console.error('Error creating/updating user profile:', error);
        }
      } else {
        // Check for guest user in localStorage
        const guestUserStr = localStorage.getItem('guestUser');
        if (guestUserStr) {
          try {
            const guestUser = JSON.parse(guestUserStr);
            // Ensure guest users don't have premium status
            localStorage.removeItem('userProfile');
            setUser(guestUser);
            setIsAuthenticated(false);
          } catch (error) {
            console.error('Error parsing guest user:', error);
            localStorage.removeItem('guestUser');
            localStorage.removeItem('userProfile');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          localStorage.removeItem('userProfile');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from database to ensure we have the latest username
      const userData = await convertFirebaseUser(firebaseUser);
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred during login';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with username
      await updateProfile(firebaseUser, {
        displayName: username
      });
      
      // Store additional user data in Realtime Database
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      await set(userRef, {
        username,
        email,
        createdAt: new Date().toISOString()
      });
      
      // Update the local user state immediately
      setUser({
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        username,
        createdAt: new Date().toISOString(),
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isAdmin: AUTHORIZED_ADMIN_EMAILS.includes(firebaseUser.email || '') ? true : undefined,
        isPremium: AUTHORIZED_ADMIN_EMAILS.includes(firebaseUser.email || '') || AUTHORIZED_PREMIUM_EMAILS.includes(firebaseUser.email || '') ? true : undefined
      });
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'An error occurred during signup';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login as guest function
  const loginAsGuest = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Generate a random guest ID and username
      const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      const guestUsername = `Guest_${Math.floor(Math.random() * 10000)}`;
      
      // Create a temporary guest user
      const guestUser: User = {
        id: guestId,
        uid: guestId,
        email: null,
        username: guestUsername,
        createdAt: new Date().toISOString(),
        displayName: null,
        photoURL: null,
        isAdmin: false,
        isPremium: false
      };
      
      // Store guest data in localStorage
      localStorage.setItem('guestUser', JSON.stringify(guestUser));
      
      // Clear any existing premium status and user profile
      localStorage.removeItem('userProfile');
      
      // Update the local user state
      setUser(guestUser);
      setIsAuthenticated(true); // Set isAuthenticated to true for guest users
      
      return { success: true };
    } catch (error: any) {
      console.error('Guest login error:', error);
      return { success: false, error: 'Failed to sign in as guest' };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      if (user?.id.startsWith('guest_')) {
        // Clear guest data from localStorage
        localStorage.removeItem('guestUser');
      } else {
        await signOut(auth);
      }
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile function
  const updateUserProfile = async (data: { 
    username?: string; 
    email?: string; 
    currentPassword?: string; 
    newPassword?: string;
    photoURL?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      if (!auth.currentUser) {
        return { success: false, error: 'No user is currently signed in' };
      }
      
      const updates: { displayName?: string; photoURL?: string } = {};
      
      // Update username if provided
      if (data.username) {
        updates.displayName = data.username;
        
        // Update username in database
        const userRef = ref(database, `users/${auth.currentUser.uid}`);
        await set(userRef, {
          ...(await get(userRef)).val(),
          username: data.username
        });
      }
      
      // Update photo URL if provided
      if (data.photoURL) {
        updates.photoURL = data.photoURL;
        
        // Update photo URL in database
        const userRef = ref(database, `users/${auth.currentUser.uid}`);
        await set(userRef, {
          ...(await get(userRef)).val(),
          photoURL: data.photoURL
        });
      }
      
      // Update profile if there are changes
      if (Object.keys(updates).length > 0) {
        await updateProfile(auth.currentUser, updates);
      }
      
      // Update email if provided
      if (data.email && data.email !== auth.currentUser.email) {
        // If changing email, require current password for security
        if (!data.currentPassword) {
          return { success: false, error: 'Current password is required to change email' };
        }
        
        // Reauthenticate user
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email || '',
          data.currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        // Update email
        await updateEmail(auth.currentUser, data.email);
        
        // Update email in database
        const userRef = ref(database, `users/${auth.currentUser.uid}`);
        await set(userRef, {
          ...(await get(userRef)).val(),
          email: data.email
        });
      }
      
      // Update password if provided
      if (data.newPassword) {
        // If changing password, require current password for security
        if (!data.currentPassword) {
          return { success: false, error: 'Current password is required to change password' };
        }
        
        // Reauthenticate user
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email || '',
          data.currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        // Update password
        await updatePassword(auth.currentUser, data.newPassword);
      }
      
      // Get stored profile
      const storedProfile = localStorage.getItem('userProfile');
      const profile = storedProfile ? JSON.parse(storedProfile) : {};
      
      // Update stored profile with new data, ensuring photoURL is preserved
      const updatedProfile = {
        ...profile,
        ...updates,
        email: data.email || profile.email,
        isAdmin: profile.isAdmin,
        isPremium: profile.isPremium,
        photoURL: data.photoURL || profile.photoURL // Ensure photoURL is preserved
      };
      
      // Save updated profile to localStorage
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      // Refresh user data
      const updatedUser = await convertFirebaseUser(auth.currentUser);
      if (updatedUser) {
        setUser(updatedUser);
        setIsAuthenticated(true);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      let errorMessage = 'An error occurred while updating your profile';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log in again before changing sensitive information';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use by another account';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update the setUser function to maintain premium status
  const setUserWithPremiumStatus = (newUser: User | null) => {
    const userWithPremiumStatus = ensurePremiumStatus(newUser);
    setUser(userWithPremiumStatus);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    loginAsGuest,
    logout,
    isAuthenticated,
    updateUserProfile,
    setUser: setUserWithPremiumStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 