import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, AuthState } from '@/types';

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  weeklyDigest: boolean;
  projectUpdates: boolean;
  invoiceAlerts: boolean;
  approvalRequests: boolean;
}

const defaultNotificationPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  weeklyDigest: true,
  projectUpdates: true,
  invoiceAlerts: true,
  approvalRequests: true,
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; password?: string; avatar?: string }) => Promise<boolean>;
  notificationPreferences: NotificationPreferences;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@company.com',
  role: 'Admin',
  status: 'Active',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      return JSON.parse(stored);
    }
    return { user: null, isAuthenticated: false };
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() => {
    const stored = localStorage.getItem('notificationPrefs');
    if (stored) {
      return { ...defaultNotificationPreferences, ...JSON.parse(stored) };
    }
    return defaultNotificationPreferences;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - accept any email/password
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (email && password) {
      const user = { ...mockUser, email };
      const newState = { user, isAuthenticated: true };
      setAuthState(newState);
      localStorage.setItem('auth', JSON.stringify(newState));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setAuthState({ user: null, isAuthenticated: false });
    localStorage.removeItem('auth');
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; email?: string; password?: string; avatar?: string }): Promise<boolean> => {
    // Mock profile update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (authState.user) {
      const updatedUser = {
        ...authState.user,
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      };
      const newState = { user: updatedUser, isAuthenticated: true };
      setAuthState(newState);
      localStorage.setItem('auth', JSON.stringify(newState));
      return true;
    }
    return false;
  }, [authState.user]);

  const updateNotificationPreferences = useCallback(async (prefs: Partial<NotificationPreferences>): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const updated = { ...notificationPreferences, ...prefs };
    setNotificationPreferences(updated);
    localStorage.setItem('notificationPrefs', JSON.stringify(updated));
    return true;
  }, [notificationPreferences]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateProfile, notificationPreferences, updateNotificationPreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
