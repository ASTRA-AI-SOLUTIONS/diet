import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/diet';
import { auth, db, googleProvider } from '../firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

export function emailToUserId(email: string): string {
  const clean = email.trim().toLowerCase();
  const safe = clean.replace(/[^a-z0-9]/g, '_');
  return `ath_${safe}`;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  authLoading: boolean;
  users: UserProfile[];
  pendingGoogleUser: { name: string; email: string; uid: string } | null;
  clearPendingGoogleUser: () => void;
  signInWithGoogle: () => Promise<boolean>;
  login: (email: string) => boolean;
  loginWithCloudId: (cloudId: string) => Promise<boolean>;
  loginWithEmailAndPasscode: (
    email: string,
    passcode?: string
  ) => Promise<{ success: boolean; requiresRegister?: boolean; error?: string }>;
  emailToUserId: (email: string) => string;
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
  const [authLoading, setAuthLoading] = useState(false);
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

  // Real-time synchronization for active athlete profile (cross-device sync)
  useEffect(() => {
    if (!currentUser?.id) return;
    const userDocRef = doc(db, 'users', currentUser.id);
    const unsub = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setCurrentUser((prev) => (prev ? { ...data, id: currentUser.id } : null));
        }
      },
      (err) => {
        console.warn('Real-time profile listener error:', err);
      }
    );
    return () => unsub();
  }, [currentUser?.id]);

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: unknown) {
        const pErr = popupErr as { code?: string };
        // If popup was blocked by browser or iframe constraints, try redirect flow
        if (pErr.code === 'auth/popup-blocked') {
          console.warn('Popup blocked, attempting signInWithRedirect fallback');
          await signInWithRedirect(auth, googleProvider);
          return false;
        }
        throw popupErr;
      }

      const fbUser = result.user;

      // Check if profile document already exists
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setCurrentUser({ ...data, id: fbUser.uid });
        setPendingGoogleUser(null);
        return true;
      } else {
        setPendingGoogleUser({
          name: fbUser.displayName || 'Athlete',
          email: fbUser.email || '',
          uid: fbUser.uid,
        });
        return false;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const loginWithEmailAndPasscode = async (
    email: string,
    passcode?: string
  ): Promise<{ success: boolean; requiresRegister?: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    const userId = emailToUserId(cleanEmail);
    try {
      const userDocRef = doc(db, 'users', userId);
      // Timeout after 6 seconds so mobile users never hang
      const snap = await Promise.race([
        getDoc(userDocRef),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 6000)
        ),
      ]);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // If profile has a passcode, verify it
        if (data.passcode && passcode && data.passcode.trim() !== passcode.trim()) {
          return { success: false, error: 'Incorrect passcode for this athlete account.' };
        }
        setCurrentUser({ ...data, id: userId });
        return { success: true };
      } else {
        return { success: false, requiresRegister: true };
      }
    } catch (err: unknown) {
      console.warn('Error during cloud login:', err);
      // Check if active profile matches this email in local storage
      if (currentUser && currentUser.email.toLowerCase() === cleanEmail) {
        return { success: true };
      }
      return { success: false, error: 'Unable to connect to cloud database. Please try again.' };
    }
  };

  const register = async (
    data: Omit<UserProfile, 'id' | 'createdAt'>
  ): Promise<UserProfile> => {
    const userId =
      firebaseUser?.uid ||
      pendingGoogleUser?.uid ||
      (data.email ? emailToUserId(data.email) : null) ||
      auth.currentUser?.uid ||
      `athlete_${Date.now()}`;

    const newUser: UserProfile = {
      ...data,
      id: userId,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, newUser, { merge: true });
    } catch (err) {
      console.warn('Saving profile to firestore error:', err);
    }

    setCurrentUser(newUser);
    setPendingGoogleUser(null);
    return newUser;
  };

  const loginWithCloudId = async (cloudId: string): Promise<boolean> => {
    const cleanId = cloudId.trim();
    if (!cleanId) return false;
    try {
      const userDocRef = doc(db, 'users', cleanId);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setCurrentUser({ ...data, id: cleanId });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error logging in with cloud id:', err);
      return false;
    }
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
        loginWithCloudId,
        loginWithEmailAndPasscode,
        emailToUserId,
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
