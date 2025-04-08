import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  EmailAuthProvider
} from 'firebase/auth';
import { ref, set, get, child } from 'firebase/database';
import { auth, database } from '@/config/firebase';

interface User {
  id: string;
  email: string | null;
  username: string;
  createdAt: string;
  photoURL?: string;
}

interface AuthContextType {
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
  const navigate = useNavigate();

  // Convert Firebase user to our User type
  const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    if (!firebaseUser) return null;
    
    try {
      // Get additional user data from Realtime Database
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        username: userData?.username || firebaseUser.displayName || 'Anonymous',
        createdAt: userData?.createdAt || new Date().toISOString(),
        photoURL: userData?.photoURL
      };
    } catch (error) {
      console.error('Error converting Firebase user:', error);
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await convertFirebaseUser(firebaseUser);
        setUser(userData);
      } else {
        // Check for guest user in localStorage
        const guestUserStr = localStorage.getItem('guestUser');
        if (guestUserStr) {
          try {
            const guestUser = JSON.parse(guestUserStr);
            setUser(guestUser);
          } catch (error) {
            console.error('Error parsing guest user:', error);
            localStorage.removeItem('guestUser');
            setUser(null);
          }
        } else {
          setUser(null);
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
        email: firebaseUser.email,
        username,
        createdAt: new Date().toISOString()
      });
      
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
        email: null,
        username: guestUsername,
        createdAt: new Date().toISOString()
      };
      
      // Store guest data in localStorage
      localStorage.setItem('guestUser', JSON.stringify(guestUser));
      
      // Update the local user state
      setUser(guestUser);
      
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
      
      // Refresh user data
      const updatedUser = await convertFirebaseUser(auth.currentUser);
      if (updatedUser) {
        setUser(updatedUser);
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

  const value = {
    user,
    loading,
    login,
    signup,
    loginAsGuest,
    logout,
    isAuthenticated: !!user,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 