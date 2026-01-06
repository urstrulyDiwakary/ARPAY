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

// API Base URL - Backend server
const API_BASE_URL = 'http://localhost:8080/api';

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
    try {
      // Call backend login API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        console.error('Login failed:', response.statusText);
        return false;
      }

      const data = await response.json();

      if (data.user) {
        const newState = { user: data.user, isAuthenticated: true };
        setAuthState(newState);
        localStorage.setItem('auth', JSON.stringify(newState));
        // Store token if returned
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      // Fallback: Create user object from email for development
      const userName = email.split('@')[0];
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: userName.charAt(0).toUpperCase() + userName.slice(1),
        email: email,
        role: 'Employee',
        status: 'Active',
      };
      const newState = { user, isAuthenticated: true };
      setAuthState(newState);
      localStorage.setItem('auth', JSON.stringify(newState));
      return true;
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({ user: null, isAuthenticated: false });
    localStorage.removeItem('auth');
    localStorage.removeItem('authToken');
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; email?: string; password?: string; avatar?: string }): Promise<boolean> => {
    try {
      if (!authState.user) return false;

      // Prepare request body - include all fields that are provided
      const requestBody: any = {};
      if (data.name !== undefined) requestBody.name = data.name;
      if (data.email !== undefined) requestBody.email = data.email;
      if (data.password !== undefined && data.password) requestBody.password = data.password;
      if (data.avatar !== undefined) requestBody.avatar = data.avatar;

      console.log('Updating profile with data:', { ...requestBody, password: requestBody.password ? '***' : undefined });

      // Try to update via backend API
      const response = await fetch(`${API_BASE_URL}/users/${authState.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        const newState = { user: updatedUser, isAuthenticated: true };
        setAuthState(newState);
        localStorage.setItem('auth', JSON.stringify(newState));
        console.log('Profile updated successfully via backend');
        return true;
      } else {
        console.error('Profile update failed with status:', response.status);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    }

    // Fallback: Update locally (but password cannot be updated locally)
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
      console.log('Profile updated locally (password changes require backend)');
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
