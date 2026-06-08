// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setLocalAccessToken, registerLogoutCallback } from '../services/api';

export interface UserContextType {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserContextType | null;
  loading: boolean;
  error: string | null;
  login: (email: string, passwordPlain: string) => Promise<void>;
  register: (email: string, passwordPlain: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextType | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Setup global logout callback for the Axios interceptor
  const handleSessionExpiry = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError("Session expired. Please log in again.");
  };

  useEffect(() => {
    registerLogoutCallback(handleSessionExpiry);
    
    // Auto-resume user session on mount by attempting a token refresh
    const checkActiveSession = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (data.authenticated) {
          setLocalAccessToken(data.accessToken);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setLocalAccessToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch {
        // Hard errors (e.g. invalid signature, blacklist)
        setLocalAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkActiveSession();
  }, []);

  const login = async (email: string, passwordPlain: string) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password: passwordPlain });
      setLocalAccessToken(data.accessToken);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, passwordPlain: string) => {
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register', { email, password: passwordPlain });
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setLocalAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
