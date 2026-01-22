import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserPreferences } from '../types';
import authService from '../services/authService';


interface AuthContextType {
  user: User | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  updatePreferences: (prefs: UserPreferences) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: UserPreferences = {
  textSize: 'Standard',
  currency: 'USD',
  language: 'English (Liberia)',
  autoCalendar: true,
  dataSaver: false,
  notifications: {
    email: true,
    sms: false,
    promotional: true
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from token
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const { user, preferences } = await authService.getCurrentUser();
          setUser(user);
          setPreferences(preferences || DEFAULT_PREFERENCES);
        } catch (error) {
          console.error('Failed to restore auth:', error);
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.signIn({ email, password });
      authService.saveToken(response.token);
      authService.saveUser(response.user);
      setUser(response.user);
      setPreferences(response.preferences || DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      const response = await authService.signUp({ name, email, password, role });
      authService.saveToken(response.token);
      authService.saveUser(response.user);
      setUser(response.user);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const demoLogin = useCallback(async (role: UserRole) => {
    setIsLoading(true);
    try {
      const response = await authService.demoLogin(role);
      authService.saveToken(response.token);
      authService.saveUser(response.user);
      setUser(response.user);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setPreferences(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    authService.saveUser(updatedUser);
  }, []);

  const updatePreferences = useCallback((prefs: UserPreferences) => {
    setPreferences(prefs);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        demoLogin,
        logout,
        updateUser,
        updatePreferences
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
