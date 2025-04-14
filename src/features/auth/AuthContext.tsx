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
  isGuest?: boolean;
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

  // Enhanced refreshUser function that forces token refresh from Firebase
  const refreshUser = async () => {
    console.log("[AuthProvider] Forcing user refresh");
    
    if (!auth.currentUser) {
      console.log("[AuthProvider] No current user to refresh");
      return;
    }
    
    setLoading(true);
    try {
      // Force refresh the token to get the latest claims
      console.log("[AuthProvider] Forcing token refresh");
      await auth.currentUser.getIdToken(true);
      
      // Convert the refreshed user to our user model
      const userData = await convertFirebaseUser(auth.currentUser);
      console.log("[AuthProvider] User data refreshed:", userData);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("[AuthProvider] Error refreshing user:", error);
    } finally {
      setLoading(false);
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
    }

    // Fetch role securely from Cloud Function - this is the ONLY source of truth for roles
    let role = { isAdmin: false, isPremium: false };
    try {
      console.log(`[AuthProvider] Fetching role for ${firebaseUser.email}`);
      role = await fetchUserRole(firebaseUser.email);
      console.log(`[AuthProvider] Role for ${firebaseUser.email}:`, role);
      
      // If user has roles in the database, ensure they match what the server says
      // This updates the database to match server-determined roles if needed
      if ((dbData as any).isAdmin !== role.isAdmin || (dbData as any).isPremium !== role.isPremium) {
        console.log(`[AuthProvider] Updating user database roles to match server-determined roles`);
        await set(userRef, {
          ...(dbData as any),
          isAdmin: role.isAdmin,
          isPremium: role.isPremium
        });
      }
    } catch (roleError) {
      console.error(`[AuthProvider] Error fetching role for ${firebaseUser.email}:`, roleError);
    }

    const userData: User = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      username: (dbData as any).username || firebaseUser.displayName || 'Guest',
      createdAt: (dbData as any).createdAt || new Date().toISOString(),
      photoURL: firebaseUser.photoURL || (dbData as any).photoURL || '',
      displayName: firebaseUser.displayName || (dbData as any).username || 'Guest',
      isAdmin: role.isAdmin, // Always use server-determined roles
      isPremium: role.isPremium, // Always use server-determined roles
      isGuest: false,
    };
    
    console.log(`[AuthProvider] Final constructed user data for ${firebaseUser.uid}:`, userData);
    return userData;
  };

  // Set up automatic token and role refresh
  useEffect(() => {
    if (user && !user.isGuest) {
      console.log("[AuthProvider] Setting up automatic token refresh");
      
      // Schedule token refresh every 5 minutes to catch permission changes
      // Reduced from 10 minutes to 5 minutes for better security
      const refreshInterval = setInterval(() => {
        console.log("[AuthProvider] Automatic token refresh triggered");
        refreshUser();
      }, 5 * 60 * 1000); // 5 minutes
      
      // Immediate refresh on focus to catch permission changes when user returns to app
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log("[AuthProvider] Document became visible, refreshing token");
          refreshUser();
        }
      };
      
      // Set up event listeners for visibility change and network reconnection
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', () => {
        console.log("[AuthProvider] Network reconnected, refreshing token");
        refreshUser();
      });

      // Random jitter refresh - refreshes randomly once every 2-4 minutes
      // This helps prevent time-of-check-to-time-of-use attacks by making
      // token refreshes unpredictable
      const randomRefresh = () => {
        const jitter = Math.floor(Math.random() * 2 * 60 * 1000) + 2 * 60 * 1000; // 2-4 minutes
        setTimeout(() => {
          console.log("[AuthProvider] Random jitter refresh triggered");
          refreshUser();
          randomRefresh(); // Schedule the next random refresh
        }, jitter);
      };
      
      // Start random refresh cycle
      randomRefresh();
      
      // Clean up interval and event listeners when component unmounts or user changes
      return () => {
        console.log("[AuthProvider] Cleaning up token refresh interval and listeners");
        clearInterval(refreshInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', refreshUser);
      };
    }
  }, [user?.id]);
  
  // URL-based refresh triggers - refresh user data when accessing admin or premium pages
  useEffect(() => {
    if (user && !user.isGuest) {
      const path = window.location.pathname;
      // Force refresh when accessing permission-dependent pages
      if (path.startsWith('/admin') || path.startsWith('/premium')) {
        console.log(`[AuthProvider] Permission-critical page detected (${path}). Refreshing token.`);
        refreshUser();
      }
    }
  }, [window.location.pathname, user?.id]);

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
          
          // Check if there's a saved route to restore after refresh
          const savedRoute = sessionStorage.getItem('lastAuthenticatedRoute');
          if (savedRoute && window.location.pathname !== savedRoute) {
            console.log("[AuthProvider] Restoring saved route:", savedRoute);
            navigate(savedRoute, { replace: true });
          }
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
  }, [navigate]);

  // Check for guest user data in sessionStorage (once at component mount)
  useEffect(() => {
    console.log("[AuthProvider] Checking for guest user in sessionStorage");
    // Only check sessionStorage if no user is already set
    if (!user) {
      setLoading(true);
      const guestUserData = sessionStorage.getItem('guestUser');
      if (guestUserData) {
        try {
          console.log("[AuthProvider] Found guest user data in sessionStorage");
          const guestUser = JSON.parse(guestUserData);
          
          // Check for session expiration
          if (guestUser.sessionExpiry && guestUser.sessionExpiry < Date.now()) {
            console.log("[AuthProvider] Guest session expired");
            sessionStorage.removeItem('guestUser');
            setLoading(false);
            return;
          }
          
          // Verify this is actually a guest user with the expected format
          if (guestUser && guestUser.id && guestUser.id.startsWith('guest_')) {
            console.log("[AuthProvider] Setting guest user from sessionStorage:", guestUser);
            setUser(guestUser);
            setIsAuthenticated(true);
            
            // Check if there's a saved route to restore after refresh
            const savedRoute = sessionStorage.getItem('lastAuthenticatedRoute');
            if (savedRoute && window.location.pathname !== savedRoute) {
              console.log("[AuthProvider] Restoring saved route for guest user:", savedRoute);
              navigate(savedRoute, { replace: true });
            }
          } else {
            console.log("[AuthProvider] Invalid guest user data in sessionStorage");
            sessionStorage.removeItem('guestUser');
          }
        } catch (error) {
          console.error("[AuthProvider] Error parsing guest user data:", error);
          sessionStorage.removeItem('guestUser');
        }
      } else {
        console.log("[AuthProvider] No guest user found in sessionStorage");
      }
      setLoading(false);
    }
  }, [navigate]);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Clear any guest user data if it exists
      localStorage.removeItem('guestUser');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Retrieve user profile
      const userProfile = await convertFirebaseUser(user);
      
      if (userProfile) {
        setUser(userProfile);
        setIsAuthenticated(true);
        
        // Get the redirect path from sessionStorage or default to home
        const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin'); // Clear after use
        
        // Use timeout to ensure navigation happens after state updates
        setTimeout(() => {
          navigate(redirectPath);
        }, 100);
        
        return { success: true };
      } else {
        throw new Error('User profile not found');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to log in';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
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
      
      // Generate random ID and username
      const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
      const guestUsername = `Guest_${Math.random().toString(36).substring(2, 5)}`;
      
      // Create guest user object with required properties
      const guestUser: User = {
        id: guestId,
        uid: guestId,
        email: `${guestId}@guest.com`,
        username: guestUsername,
        displayName: guestUsername,
        createdAt: new Date().toISOString(),
        photoURL: null,
        isAdmin: false,
        isPremium: false,
        isGuest: true // Flag to identify guest users
      };

      // Store guest data in sessionStorage instead of localStorage
      sessionStorage.setItem('guestUser', JSON.stringify({
        ...guestUser,
        sessionExpiry: Date.now() + (3600 * 1000) // Session expires in 1 hour
      }));
      
      // Clear any existing admin mode
      sessionStorage.removeItem('adminMode');
      
      // Update local state
      setUser(guestUser);
      setIsAuthenticated(true);
      
      // Get the redirect path from sessionStorage or default to home
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin'); // Clear after use
      
      // Use timeout to ensure navigation happens after state updates
      setTimeout(() => {
        navigate(redirectPath);
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Guest login error:', error);
      return { 
        success: false, 
        error: 'Failed to create guest session' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout with complete session cleaning
  const logout = async (): Promise<void> => {
    try {
      console.log("[AuthProvider] Logout initiated");
      
      // Clear all storage first - while we still have auth
      if (user) {
        // Perform a server logout record action
        try {
          const functions = getFunctions();
          const logLogout = httpsCallable(functions, 'logUserActivity');
          await logLogout({ activity: 'logout', timestamp: new Date().toISOString() });
        } catch (serverLogError) {
          console.error("[AuthProvider] Error logging logout to server:", serverLogError);
        }
      }
      
      // Get current URL path for later redirect check
      const currentPath = window.location.pathname;
      
      // Determine if current page is protected
      const isProtectedPage = ['/admin', '/premium', '/settings', '/match-history'].some(
        path => currentPath.startsWith(path)
      );
      
      // Firebase sign out
      await signOut(auth);

      // Clear all session data
      sessionStorage.clear();
      localStorage.removeItem('userProfile');
      sessionStorage.removeItem('lastAuthenticatedRoute');
      sessionStorage.removeItem('guestUser');
      sessionStorage.removeItem('adminMode');
      sessionStorage.removeItem('redirectAfterLogin');
      
      // Clean up cookies that might contain session data
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      
      // Navigate back to home if on a protected page
      if (isProtectedPage) {
        navigate('/', { replace: true });
      }
      
      console.log("[AuthProvider] Logout completed successfully");
    } catch (error) {
      console.error("[AuthProvider] Error during logout:", error);
      // Even if there's an error, clear user state to prevent UI showing logged in state
      setUser(null);
      setIsAuthenticated(false);
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