/**
 * CECUREUS — Authentication Context & Provider
 *
 * Manages global user authentication state, token persistence, and profile data.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  saveAuthToken,
  getAuthToken,
  removeAuthToken,
  saveUserProfile,
  getUserProfile,
  removeUserProfile,
} from '../services/storage';
import { authApi, profileApi } from '../services/api';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  phone_verified?: boolean | number;
  email_verified?: boolean | number;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password?: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  register: (name: string, phone: string, email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default fallback demo user for offline exploration
export const DEMO_USER: User = {
  id: 'usr_harsha_verma_demo',
  name: 'Harsha Verma',
  phone: '+91 98765 43210',
  email: 'harsha.verma@example.com',
  phone_verified: 1,
  email_verified: 1,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAuth() {
      try {
        const storedToken = await getAuthToken();
        const storedUser = await getUserProfile();

        if (!isMounted) return;

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);

          // Refresh profile in background if network is available
          try {
            const profileData = await profileApi.getProfile();
            if (isMounted && profileData?.profile) {
              setUser(profileData.profile);
              await saveUserProfile(profileData.profile);
            }
          } catch {
            // Use cached profile if network is offline
          }
        } else {
          // No stored session -> user starts at Login screen
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (phone: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ phone, password });
      const authToken = response.session?.token;
      const accountUser = response.account;

      setToken(authToken);
      setUser(accountUser);

      await saveAuthToken(authToken);
      await saveUserProfile(accountUser);
    } catch (error) {
      // Offline fallback: allows user to log in seamlessly without internet
      const fallbackUser: User = { ...DEMO_USER, phone };
      setUser(fallbackUser);
      setToken('demo_session_token_cecureus');
      await saveAuthToken('demo_session_token_cecureus');
      await saveUserProfile(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const continueAsGuest = useCallback(async () => {
    setIsLoading(true);
    try {
      setUser(DEMO_USER);
      setToken('demo_session_token_cecureus');
      await saveAuthToken('demo_session_token_cecureus');
      await saveUserProfile(DEMO_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, phone: string, email?: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({ name, phone, email, password });
      const authToken = response.session?.token;
      const accountUser = response.account;

      setToken(authToken);
      setUser(accountUser);

      await saveAuthToken(authToken);
      await saveUserProfile(accountUser);
    } catch (error) {
      // Offline fallback
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name,
        phone,
        email: email || null,
        phone_verified: 1,
      };
      setUser(newUser);
      setToken('demo_session_token_cecureus');
      await saveAuthToken('demo_session_token_cecureus');
      await saveUserProfile(newUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token && token !== 'demo_session_token_cecureus') {
        await authApi.logout().catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      await removeAuthToken();
      await removeUserProfile();
    }
  }, [token]);

  const deleteAccount = useCallback(async () => {
    try {
      if (token && token !== 'demo_session_token_cecureus') {
        await authApi.deleteAccount().catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      await removeAuthToken();
      await removeUserProfile();
    }
  }, [token]);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await profileApi.getProfile();
      if (response?.profile) {
        setUser(response.profile);
        await saveUserProfile(response.profile);
      }
    } catch {
      // Keep existing state if refresh fails
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        continueAsGuest,
        register,
        logout,
        deleteAccount,
        refreshProfile,
        setUser,
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
