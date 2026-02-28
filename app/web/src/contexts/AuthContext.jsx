import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

function getAuthErrorMessage(error) {
  const data = error?.data;
  const status = error?.status;
  if (data?.message) return data.message;
  const msg = error?.message || 'Unknown error';
  if (msg === 'Failed to fetch' || msg?.toLowerCase?.().includes('network')) {
    return 'Cannot reach the server. Is PocketBase running? Try http://127.0.0.1:8091';
  }
  if (msg?.includes('Something went wrong')) {
    const extra = status ? ` (HTTP ${status})` : '';
    return msg + extra + '. Check PocketBase terminal for errors.';
  }
  return msg;
}

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    if (pb.authStore.isValid && pb.authStore.model) {
      setCurrentUser(pb.authStore.model);
    }
    setInitialLoading(false);

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setCurrentUser(authData.record);
      return { success: true, user: authData.record };
    } catch (error) {
      console.error('Login error:', error);
      const msg = getAuthErrorMessage(error);
      return { success: false, error: msg };
    }
  };

  const signup = async (email, password, passwordConfirm, username) => {
    try {
      const userData = {
        email,
        password,
        passwordConfirm,
        username,
        emailVisibility: true,
      };
      
      const record = await pb.collection('users').create(userData);
      
      // Auto-login after signup
      const authData = await pb.collection('users').authWithPassword(email, password);
      setCurrentUser(authData.record);
      
      return { success: true, user: authData.record };
    } catch (error) {
      console.error('Signup error:', error);
      const msg = getAuthErrorMessage(error);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const updateProfile = async (userId, data) => {
    try {
      const updated = await pb.collection('users').update(userId, data, { $autoCancel: false });
      setCurrentUser(updated);
      return { success: true, user: updated };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    signup,
    logout,
    updateProfile,
    initialLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};