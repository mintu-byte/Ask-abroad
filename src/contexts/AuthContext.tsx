import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string, userType?: 'user' | 'consultant') => Promise<void>;
  signup: (email: string, password: string, displayName: string, mobileNumber: string, userType: 'user' | 'resident') => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (displayName: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  incrementGuestMessageCount: () => Promise<void>;
  loading: boolean;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Get user data from database
        const userRef = ref(database, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          setCurrentUser(snapshot.val());
        } else {
          // Create user data if doesn't exist
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            userType: 'user',
            createdAt: new Date().toISOString()
          };
          
          await set(userRef, userData);
          setCurrentUser(userData);
        }
      } else {
        // Check for guest user in localStorage
        const guestUser = localStorage.getItem('guestUser');
        if (guestUser) {
          setCurrentUser(JSON.parse(guestUser));
        } else {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string, userType: 'user' | 'consultant' = 'user') => {
    try {
      // Check if it's a consultant login
      if (userType === 'consultant') {
        // Check if consultant credentials exist in database
        const consultantRef = ref(database, `consultants/${email.replace(/[.#$[\]]/g, '_')}`);
        const consultantSnapshot = await get(consultantRef);
        
        if (!consultantSnapshot.exists()) {
          throw new Error('Invalid Industry Expert credentials - Email not found');
        }
        
        const consultantData = consultantSnapshot.val();
        if (consultantData.password !== password || !consultantData.isActive) {
          throw new Error('Invalid Industry Expert credentials - Incorrect password or inactive account');
        }
      }

      // Proceed with Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // If consultant login, update user type in database
      if (userType === 'consultant') {
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          userData.userType = 'consultant';
          await set(userRef, userData);
        } else {
          // Create consultant user data
          const consultantRef = ref(database, `consultants/${email.replace(/[.#$[\]]/g, '_')}`);
          const consultantSnapshot = await get(consultantRef);
          const consultantData = consultantSnapshot.val();
          
          const userData: User = {
            uid: user.uid,
            email: email,
            displayName: consultantData.name,
            userType: 'consultant',
            createdAt: new Date().toISOString(),
            // Consultants don't need reasonForJoining as they're here to help
            reasonForJoining: 'AskAbroad Industry Expert - Here to help users with their international goals'
          };
          
          await set(userRef, userData);
        }
      }

      // Clear guest user from localStorage
      localStorage.removeItem('guestUser');
      toast.success('Successfully logged in!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName: string, mobileNumber: string, userType: 'user' | 'resident') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData: User = {
        uid: user.uid,
        email: email,
        displayName: displayName,
        mobileNumber: mobileNumber,
        userType: userType,
        createdAt: new Date().toISOString()
      };

      await set(ref(database, `users/${user.uid}`), userData);
      
      // Clear guest user from localStorage
      localStorage.removeItem('guestUser');
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in database
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        // Create new user data
        const userData: User = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          userType: 'user',
          createdAt: new Date().toISOString()
        };

        await set(userRef, userData);
      }

      // Clear guest user from localStorage
      localStorage.removeItem('guestUser');
      toast.success('Successfully logged in with Google!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginAsGuest = async (displayName: string, email: string) => {
    try {
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const guestUser: User = {
        uid: guestId,
        email: email,
        displayName: displayName,
        userType: 'guest',
        createdAt: new Date().toISOString(),
        messageCount: 0,
        isGuest: true
      };

      // Store guest user in localStorage
      localStorage.setItem('guestUser', JSON.stringify(guestUser));
      setCurrentUser(guestUser);
      
      toast.success('Welcome as guest! You can send up to 5 messages.');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const incrementGuestMessageCount = async () => {
    if (!currentUser || !currentUser.isGuest) return;

    const updatedUser = {
      ...currentUser,
      messageCount: (currentUser.messageCount || 0) + 1
    };

    localStorage.setItem('guestUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      if (currentUser.isGuest) {
        // Update guest user in localStorage
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('guestUser', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      } else {
        // Update authenticated user in database
        const userRef = ref(database, `users/${currentUser.uid}`);
        await update(userRef, updates);
        
        // Update local state
        setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
      }
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (currentUser?.isGuest) {
        // Clear guest user from localStorage
        localStorage.removeItem('guestUser');
        setCurrentUser(null);
      } else {
        await signOut(auth);
      }
      toast.success('Successfully logged out!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    loginWithGoogle,
    loginAsGuest,
    logout,
    updateUserProfile,
    incrementGuestMessageCount,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};