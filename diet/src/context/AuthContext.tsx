import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/diet';
import { INITIAL_USERS } from '../data/seedData';

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  login: (email: string) => boolean;
  register: (newUser: Omit<UserProfile, 'id' | 'createdAt'>) => UserProfile;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateCurrentUser: (updated: Partial<UserProfile>) => void;
  updateUser: (userId: string, updated: Partial<UserProfile>) => void;
  deleteAccount: (userId: string) => void;
}

const STORAGE_USERS_KEY = 'astradiet_v2_users';
const STORAGE_CURRENT_USER_ID = 'astradiet_v2_current_user_id';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_CURRENT_USER_ID);
      if (savedId) return savedId;
    } catch {
      // Fallback
    }
    return INITIAL_USERS[0]?.id || null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(STORAGE_CURRENT_USER_ID, currentUserId);
      } else {
        localStorage.removeItem(STORAGE_CURRENT_USER_ID);
      }
    } catch (e) {
      console.error('Error saving current user ID', e);
    }
  }, [currentUserId]);

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  const login = (email: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === trimmed);
    if (found) {
      setCurrentUserId(found.id);
      return true;
    }
    return false;
  };

  const register = (data: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile => {
    const newId = `user_${Date.now()}`;
    const newUser: UserProfile = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newId);
    return newUser;
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
    }
  };

  const updateCurrentUser = (updated: Partial<UserProfile>) => {
    if (!currentUserId) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUserId ? { ...u, ...updated } : u))
    );
  };

  const updateUser = (userId: string, updated: Partial<UserProfile>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
    );
  };

  const deleteAccount = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUserId === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      setCurrentUserId(remaining[0]?.id || null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
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
