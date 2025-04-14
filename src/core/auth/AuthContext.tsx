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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, database } from '../firebase';
import { SecureLogger } from '@shared/utils/secureLogging';

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
  refreshUser: () => Promise<void>;
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
  const functions = getFunctions();

  // Function to fetch user role from Cloud Function
  const fetchUserRole = async (email: string | null): Promise<{ isAdmin: boolean; isPremium: boolean }> => {
    if (!email) return { isAdmin: false, isPremium: false };
    try {
      const getUserRole = httpsCallable<{ email: string }, { isAdmin: boolean; isPremium: boolean }>(functions, 'getUserRole');
      const result = await getUserRole({ email });
      return result.data;
    } catch (error) {
      // Silent error handling
      return { isAdmin: false, isPremium: false }; // Default to non-privileged on error
    }
  };

  // Convert Firebase user to our User type, fetching role from backend
  const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userRef = ref(database, `users/${firebaseUser.uid}`);
    let dbData = {};
    try {
      const snapshot = await get(userRef);
      dbData = snapshot.val() || {};
    } catch (rtdbError) {
      // Silent error handling
    }

    // Fetch role securely from Cloud Function
    let role = { isAdmin: false, isPremium: false };
    try {
      role = await fetchUserRole(firebaseUser.email);
    } catch (roleError) {
      // Silent error handling
    }

    const userData: User = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      // Prioritize DB username > Firebase Auth display name
      username: (dbData as any).username || firebaseUser.displayName || 'Guest', // Added fallback
      createdAt: (dbData as any).createdAt || new Date().toISOString(),
      photoURL: firebaseUser.photoURL || (dbData as any).photoURL || '',
      displayName: firebaseUser.displayName || (dbData as any).username || 'Guest', // Added fallback
      isAdmin: role.isAdmin,
      isPremium: role.isPremium,
    };
    return userData;
  };

  // Listen for auth state changes
  useEffect(() => {
    SecureLogger.log("[AuthProvider] useEffect started");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      SecureLogger.log(`[AuthProvider] onAuthStateChanged triggered. User: ${firebaseUser?.uid}`);
      if (firebaseUser) {
        setLoading(true); // Start loading while fetching user data and role
        try {
          const userData = await convertFirebaseUser(firebaseUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          setUser(null);
          setIsAuthenticated(false);
          // Maybe logout here if conversion fails?
        } finally {
          setLoading(false);
        }
      } else {
        SecureLogger.log("[AuthProvider] No Firebase user found (logged out or initial state).");
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        SecureLogger.log("[AuthProvider] Setting loading to false (no user path)");
      }
    });

    // Cleanup subscription
    return () => {
      SecureLogger.log("[AuthProvider] useEffect cleanup");
      unsubscribe();
    }
  }, []);

  // Check for guest user data in localStorage (just once at component mount)
  useEffect(() => {
    // Only check localStorage if no user is already set (e.g., from Firebase auth)
    if (!user) {
      setLoading(true);
      SecureLogger.log("[AuthProvider] Checking for guest user in sessionStorage");
      const guestUserData = localStorage.getItem('guestUser');
      if (guestUserData) {
        SecureLogger.log("[AuthProvider] Found guest user data in sessionStorage");
        try {
          const guestUser = JSON.parse(guestUserData);
          // Verify this is actually a guest user with the expected format
          if (guestUser && guestUser.id && guestUser.id.startsWith('guest_')) {
            SecureLogger.log(`[AuthProvider] Setting guest user from sessionStorage: ${JSON.stringify(guestUser)}`);
            setUser(guestUser);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('guestUser');
          }
        } catch (error) {
          localStorage.removeItem('guestUser');
        }
      }
      setLoading(false);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state
      return { success: true };
    } catch (error: any) {
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Auth profile
      await updateProfile(firebaseUser, { displayName: username });

      // Create initial record in Realtime Database
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      await set(userRef, {
        username,
        email,
        createdAt: new Date().toISOString(),
        photoURL: firebaseUser.photoURL, // Include initial photoURL if any
        // isAdmin and isPremium will be determined by onAuthStateChanged -> convertFirebaseUser -> fetchUserRole
      });

      // onAuthStateChanged will handle setting the user state
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'An error occurred during signup';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Guest login
  const loginAsGuest = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Generate a guest user ID
      const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
      const guestName = `Guest_${Math.random().toString(36).substring(2, 5)}`;
      
      // Create a guest user object
      const guestUser: User = {
        id: guestId,
        uid: guestId,
        email: `${guestId}@guest.com`, // Generate a fake email
        username: guestName,
        displayName: guestName,
        createdAt: new Date().toISOString(),
        isAdmin: false,
        isPremium: false
      };
      
      // Save to localStorage for persistence
      localStorage.setItem('guestUser', JSON.stringify(guestUser));
      
      // Set the user in our state
      setUser(guestUser);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to create guest account' };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      SecureLogger.log("[AuthProvider] Logout initiated");
      // Check if the user is a guest
      const isGuest = user?.id.startsWith('guest_');
      
      if (isGuest) {
        // Remove guest user from localStorage
        localStorage.removeItem('guestUser');
        // Clear user from state
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // Regular user logout via Firebase
        await signOut(auth);
        // Firebase auth state listener will handle clearing the user
      }
      
      // Force redirect to homepage
      navigate('/', { replace: true });
      SecureLogger.log("[AuthProvider] Logout completed successfully");
    } catch (error) {
      // Silent error handling in production
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (data: { 
    username?: string; 
    email?: string; 
    currentPassword?: string; 
    newPassword?: string;
    photoURL?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const { username, email, currentPassword, newPassword, photoURL } = data;
    
    if (!auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    try {
      setLoading(true);
      
      // Track if any update was made to synchronize with database
      let updatesMade = false;
      let emailChanged = false;
      
      // Update email if provided
      if (email && email !== auth.currentUser.email) {
        if (!currentPassword) {
          return { success: false, error: 'Current password is required to update email' };
        }
        
        // Re-authenticate before changing email
        try {
          const credential = EmailAuthProvider.credential(
            auth.currentUser.email || '', // Existing email
            currentPassword // Current password
          );
          await reauthenticateWithCredential(auth.currentUser, credential);
          await updateEmail(auth.currentUser, email);
          emailChanged = true;
          updatesMade = true;
        } catch (error: any) {
          if (error.code === 'auth/wrong-password') {
            return { success: false, error: 'Current password is incorrect' };
          } else if (error.code === 'auth/email-already-in-use') {
            return { success: false, error: 'Email is already in use' };
          } else {
            return { success: false, error: 'Failed to update email' };
          }
        }
      }
      
      // Update password if provided
      if (newPassword && currentPassword) {
        try {
          // Only re-authenticate if we haven't already done so for email change
          if (!emailChanged) {
            const credential = EmailAuthProvider.credential(
              auth.currentUser.email || '',
              currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
          }
          
          await updatePassword(auth.currentUser, newPassword);
          updatesMade = true;
        } catch (error: any) {
          if (error.code === 'auth/wrong-password') {
            return { success: false, error: 'Current password is incorrect' };
          } else {
            return { success: false, error: 'Failed to update password' };
          }
        }
      }
      
      // Update display name if provided
      if (username) {
        await updateProfile(auth.currentUser, { displayName: username });
        updatesMade = true;
      }
      
      // Update photo URL if provided
      if (photoURL !== undefined) {
        await updateProfile(auth.currentUser, { photoURL });
        updatesMade = true;
      }
      
      // Sync with database if any updates were made
      if (updatesMade) {
        // Refresh user data
        await refreshUser();
        
        // Also update the database record
        const userRef = ref(database, `users/${auth.currentUser.uid}`);
        await get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const updates: any = {};
            if (username) {
              updates.username = username;
              updates.displayName = username;
            }
            if (email) {
              updates.email = email;
            }
            if (photoURL !== undefined) {
              updates.photoURL = photoURL;
            }
            
            if (Object.keys(updates).length > 0) {
              set(userRef, { ...snapshot.val(), ...updates });
            }
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data from backend
  const refreshUser = async () => {
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      const userData = await convertFirebaseUser(auth.currentUser);
      setUser(userData);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const authContextValue: AuthContextType = {
    user,
    loading,
    login,
    signup,
    loginAsGuest,
    logout,
    isAuthenticated,
    updateUserProfile,
    setUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 