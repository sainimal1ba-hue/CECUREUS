/**
 * CECUREUS — Global Authentication Context & State Provider
 *
 * Why this file was created:
 * This React context manages the global authentication lifecycle across the entire mobile application.
 * It was created to provide a unified reactive state layer:
 * - Bootstraps session state on app launch by reading secure persistent storage (`getAuthToken()`, `getUserProfile()`).
 * - Validates stored JWT tokens against the backend on boot. If expired or invalid, instantly purges
 *   the session and routes to the Login/Welcome screen (preventing unwanted auto-login).
 * - Implements Optimistic Fast Logout: synchronously resets user state and purges local storage,
 *   firing session revocation in the background so navigation is instantaneous.
 * - Exposes high-level action primitives: `login()`, `logout()`, `register()`, `refreshProfile()`, and `deleteAccount()`.
 * - Prevents race conditions and desynchronization between on-disk tokens and in-memory session user state.
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
  loginWithOtp: (identifier: string, code: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  register: (name: string, phone: string, email?: string, password?: string) => Promise<void>;
  registerWithOtp: (data: {
    name: string;
    phone: string;
    email: string;
    password?: string;
    emailOtp?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state on mount with strict token verification
  useEffect(() => {
    let isMounted = true;

    async function loadAuth() {
      try {
        const storedToken = await getAuthToken();
        const storedUser = await getUserProfile();

        if (!isMounted) return;

        // Purge legacy demo tokens
        if (
          !storedToken ||
          storedToken === 'demo_session_token_cecureus' ||
          storedToken === 'guest_token' ||
          storedUser?.id === 'usr_harsha_verma_demo'
        ) {
          await removeAuthToken();
          await removeUserProfile();
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
          return;
        }

        // Verify active token against backend session authority
        try {
          const profileData = await profileApi.getProfile();
          if (!isMounted) return;

          if (profileData?.profile) {
            setToken(storedToken);
            setUser(profileData.profile);
            await saveUserProfile(profileData.profile);
          } else {
            // Unexpected response payload -> purge session
            await removeAuthToken();
            await removeUserProfile();
            setUser(null);
            setToken(null);
          }
        } catch (apiErr: any) {
          // If server rejects token (401 Unauthorized or 403 Forbidden), purge session immediately
          if (apiErr?.statusCode === 401 || apiErr?.statusCode === 403) {
            await removeAuthToken();
            await removeUserProfile();
            if (isMounted) {
              setUser(null);
              setToken(null);
            }
          } else if (storedUser && storedToken) {
            // Temporary offline/network glitch: retain local session if already verified before
            if (isMounted) {
              setToken(storedToken);
              setUser(storedUser);
            }
          } else {
            await removeAuthToken();
            await removeUserProfile();
            if (isMounted) {
              setUser(null);
              setToken(null);
            }
          }
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

  const login = useCallback(async (identifier: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ phone: identifier, password });
      const authToken = response.session?.token;
      const accountUser = response.account;

      if (!authToken || !accountUser) {
        throw new Error('Invalid response from server. Please try again.');
      }

      setToken(authToken);
      setUser(accountUser);

      await saveAuthToken(authToken);
      await saveUserProfile(accountUser);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed. Please check your credentials and internet connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithOtp = useCallback(async (identifier: string, code: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.loginWithOtp({
        identifier: identifier.trim(),
        code: code.trim(),
      });
      const authToken = response.session?.token;
      const accountUser = response.account;

      if (!authToken || !accountUser) {
        throw new Error('Invalid response from server. Please try again.');
      }

      setToken(authToken);
      setUser(accountUser);

      await saveAuthToken(authToken);
      await saveUserProfile(accountUser);
    } catch (error: any) {
      throw new Error(error.message || 'Login with OTP failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const continueAsGuest = useCallback(async () => {
    setIsLoading(true);
    try {
      const guestUser: User = {
        id: `guest_${Date.now()}`,
        name: 'Guest User',
        phone: '',
      };
      setUser(guestUser);
      setToken('guest_token');
      await saveUserProfile(guestUser);
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
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed. Please check your details and connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerWithOtp = useCallback(
    async (data: {
      name: string;
      phone: string;
      email: string;
      password?: string;
      emailOtp?: string;
    }) => {
      setIsLoading(true);
      try {
        const response = await authApi.registerWithOtp(data);
        const authToken = response.session?.token;
        const accountUser = response.account;

        if (!authToken || !accountUser) {
          throw new Error('Invalid registration response from server.');
        }

        setToken(authToken);
        setUser(accountUser);

        await saveAuthToken(authToken);
        await saveUserProfile(accountUser);
      } catch (error: any) {
        throw new Error(error.message || 'Registration failed. Please check your details and connection.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Optimistic Fast Logout
   * Instantly purges memory and local storage so navigation resets immediately.
   * Session revocation API call fires in the background without blocking the UI.
   */
  const logout = useCallback(async () => {
    const currentToken = token;

    // 1. Instantly reset client state & purge storage (optimistic)
    setToken(null);
    setUser(null);
    await Promise.all([removeAuthToken(), removeUserProfile()]);

    // 2. Fire server revocation asynchronously in background (fire-and-forget)
    if (currentToken && currentToken !== 'guest_token') {
      authApi.logout().catch(() => {});
    }
  }, [token]);

  const deleteAccount = useCallback(async () => {
    const currentToken = token;

    // 1. Instantly reset client state & purge storage
    setToken(null);
    setUser(null);
    await Promise.all([removeAuthToken(), removeUserProfile()]);

    // 2. Fire backend account deletion asynchronously
    if (currentToken && currentToken !== 'guest_token') {
      authApi.deleteAccount().catch(() => {});
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
        loginWithOtp,
        continueAsGuest,
        register,
        registerWithOtp,
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
