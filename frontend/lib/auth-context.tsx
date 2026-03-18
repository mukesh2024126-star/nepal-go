'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: number;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getInitialAuthState(): AuthState {
  if (typeof window === 'undefined') return { user: null, token: null, isLoggedIn: false };

  const token = localStorage.getItem('nepal_token');
  const userStr = localStorage.getItem('nepal_user');
  if (!token || !userStr) return { user: null, token: null, isLoggedIn: false };

  try {
    const user = JSON.parse(userStr) as User;
    return { user, token, isLoggedIn: true };
  } catch {
    localStorage.removeItem('nepal_token');
    localStorage.removeItem('nepal_user');
    return { user: null, token: null, isLoggedIn: false };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getInitialAuthState);

  const login = (token: string, user: User) => {
    localStorage.setItem('nepal_token', token);
    localStorage.setItem('nepal_user', JSON.stringify(user));
    document.cookie = `nepal_token=${token}; path=/; max-age=${7 * 24 * 3600}`;
    setState({ user, token, isLoggedIn: true });
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem('nepal_token');
    localStorage.removeItem('nepal_user');
    document.cookie = 'nepal_token=; path=/; max-age=0';
    setState({ user: null, token: null, isLoggedIn: false });
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
