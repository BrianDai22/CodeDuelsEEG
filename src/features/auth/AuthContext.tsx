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
import { auth, database } from '@shared/config/firebase';

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
      console.error('Error fetching user role:', error);
      return { isAdmin: false, isPremium: false }; // Default to non-privileged on error
    }
  };

  // Convert Firebase user to our User type, fetching role from backend
  const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    console.log(`[AuthProvider] convertFirebaseUser called for ${firebaseUser.uid}`);
    const userRef = ref(database, `users/${firebaseUser.uid}`);
    let dbData = {};
    try {
      console.log(`[AuthProvider] Fetching data from RTDB for ${firebaseUser.uid}`);
      const snapshot = await get(userRef);
      dbData = snapshot.val() || {};
      console.log(`[AuthProvider] RTDB data for ${firebaseUser.uid}:`, dbData);
    } catch (rtdbError) {
      console.error(`[AuthProvider] Error fetching RTDB data for ${firebaseUser.uid}:`, rtdbError);
      // Decide how to handle RTDB fetch error - maybe proceed with default/auth data?
      // Throwing here will stop the process and likely keep loading=true
      // throw rtdbError; 
    }

    // Fetch role securely from Cloud Function
    let role = { isAdmin: false, isPremium: false };
    try {
      console.log(`[AuthProvider] Fetching role for ${firebaseUser.email}`);
      role = await fetchUserRole(firebaseUser.email);
      console.log(`[AuthProvider] Role for ${firebaseUser.email}:`, role);
    } catch (roleError) {
      console.error(`[AuthProvider] Error fetching role for ${firebaseUser.email}:`, roleError);
      // Decide how to handle role fetch error - default roles are already set
      // Maybe log and continue with default roles?
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
    console.log(`[AuthProvider] Final constructed user data for ${firebaseUser.uid}:`, userData);
    return userData;
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log("[AuthProvider] useEffect started");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[AuthProvider] onAuthStateChanged triggered. User:", firebaseUser?.uid);
      if (firebaseUser) {
        setLoading(true); // Start loading while fetching user data and role
        console.log("[AuthProvider] Firebase user found, starting data conversion...");
        try {
          const userData = await convertFirebaseUser(firebaseUser);
          console.log("[AuthProvider] User data converted:", userData);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("[AuthProvider] Error processing authenticated user:", error);
          setUser(null);
          setIsAuthenticated(false);
          // Maybe logout here if conversion fails?
        } finally {
          console.log("[AuthProvider] Setting loading to false (user found path)");
          setLoading(false);
        }
      } else {
        console.log("[AuthProvider] No Firebase user found (logged out or initial state).");
        setUser(null);
        setIsAuthenticated(false);
        console.log("[AuthProvider] Setting loading to false (no user path)");
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => {
      console.log("[AuthProvider] useEffect cleanup");
      unsubscribe();
    }
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state
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
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user signed in.');

      const authUpdates: { displayName?: string | null; photoURL?: string | null } = {};
      const dbUpdates: { username?: string; photoURL?: string } = {};

      if (data.username !== undefined) {
        authUpdates.displayName = data.username;
        dbUpdates.username = data.username;
      }
      if (data.photoURL !== undefined) {
        authUpdates.photoURL = data.photoURL;
        dbUpdates.photoURL = data.photoURL;
      }

      // Update Firebase Auth profile
      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(currentUser, authUpdates);
      }

      // Update Realtime Database
      if (Object.keys(dbUpdates).length > 0) {
        const userRef = ref(database, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        await set(userRef, { ...snapshot.val(), ...dbUpdates });
      }

      // Handle password change (requires re-authentication)
      if (data.currentPassword && data.newPassword) {
        const credential = EmailAuthProvider.credential(currentUser.email!, data.currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, data.newPassword);
      }
      
      // Refresh user state to reflect changes
      const updatedUserData = await convertFirebaseUser(currentUser);
      setUser(updatedUserData);

      return { success: true };

    } catch (error: any) { 
      console.error('Update profile error:', error);
      // Map error codes to user-friendly messages
      return { success: false, error: 'Failed to update profile.' };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setLoading(true);
      try {
        const userData = await convertFirebaseUser(currentUser);
        setUser(userData);
      } catch (error) {
        console.error("Error refreshing user data:", error);
        // Optionally logout or handle error
      } finally {
        setLoading(false);
      }
    } else {
      // No user logged in, ensure state is clear
      setUser(null);
      setIsAuthenticated(false);
    }
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
    setUser,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 