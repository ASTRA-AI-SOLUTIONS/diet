import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/diet';
import { auth, db, googleProvider } from '../firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  authLoading: boolean;
  users: UserProfile[];
  pendingGoogleUser: { name: string; email: string; uid: string } | null;
  clearPendingGoogleUser: () => void;
  signInWithGoogle: () => Promise<boolean>;
  login: (email: string) => boolean;
  register: (newUser: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<UserProfile>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  updateCurrentUser: (updated: Partial<UserProfile>) => Promise<void>;
  updateUser: (userId: string, updated: Partial<UserProfile>) => Promise<void>;
  deleteAccount: (userId: string) => Promise<void>;
}

const STORAGE_PROFILE_KEY = 'astradiet_cloud_profile';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    name: string;
    email: string;
    uid: string;
  } | null>(null);

  // Sync state to local storage for fast warm boots
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_PROFILE_KEY);
      }
    } catch (e) {
      console.error('Error saving profile to localStorage', e);
    }
  }, [currentUser]);

  // Listen to Firebase Auth state
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);

        // Real-time listener for current user document
        unsubscribeFirestore = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              setCurrentUser({ ...data, id: fbUser.uid });
              setPendingGoogleUser(null);
            } else {
              // Authenticated with Google but no profile doc created yet
              setPendingGoogleUser({
                name: fbUser.displayName || '',
                email: fbUser.email || '',
                uid: fbUser.uid,
              });
            }
            setAuthLoading(false);
          },
          (err) => {
            console.warn('Firestore snapshot error:', err);
            setAuthLoading(false);
          }
        );
      } else {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
        setPendingGoogleUser(null);
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // Check if profile document already exists
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setCurrentUser({ ...data, id: fbUser.uid });
        setPendingGoogleUser(null);
        setAuthLoading(false);
        return true;
      } else {
        setPendingGoogleUser({
          name: fbUser.displayName || '',
          email: fbUser.email || '',
          uid: fbUser.uid,
        });
        setAuthLoading(false);
        return false;
      }
    } catch (error) {
      setAuthLoading(false);
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const register = async (
    data: Omit<UserProfile, 'id' | 'createdAt'>
  ): Promise<UserProfile> => {
    const userId = firebaseUser?.uid || pendingGoogleUser?.uid || auth.currentUser?.uid;
    if (!userId) {
      throw new Error('Please sign in with Google to create your athlete protocol.');
    }
    const newUser: UserProfile = {
      ...data,
      id: userId,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, newUser);
    } catch (err) {
      console.warn('Saving profile to firestore error:', err);
    }

    setCurrentUser(newUser);
    setPendingGoogleUser(null);
    return newUser;
  };

  const login = (email: string): boolean => {
    if (currentUser && currentUser.email.toLowerCase() === email.trim().toLowerCase()) {
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error', e);
    }
    setCurrentUser(null);
    setPendingGoogleUser(null);
    localStorage.removeItem(STORAGE_PROFILE_KEY);
  };

  const switchUser = (userId: string) => {
    if (currentUser?.id === userId) return;
  };

  const updateCurrentUser = async (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const merged = { ...currentUser, ...updated };
    setCurrentUser(merged);

    try {
      const userDocRef = doc(db, 'users', currentUser.id);
      await setDoc(userDocRef, updated, { merge: true });
    } catch (err) {
      console.warn('Error updating profile in firestore:', err);
    }
  };

  const updateUser = async (userId: string, updated: Partial<UserProfile>) => {
    if (currentUser?.id === userId) {
      await updateCurrentUser(updated);
    }
  };

  const deleteAccount = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
    } catch (err) {
      console.warn('Error deleting user profile from firestore:', err);
    }

    await logout();
  };

  const clearPendingGoogleUser = () => {
    setPendingGoogleUser(null);
  };

  const users = currentUser ? [currentUser] : [];

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        authLoading,
        users,
        pendingGoogleUser,
        clearPendingGoogleUser,
        signInWithGoogle,
        login,
        register,
        logout,
        switchUser,
        updateCurrentUser,
        updateUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
