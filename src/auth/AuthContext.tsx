import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AdminUser } from '@/api/authApi';

const STORAGE_KEY = 'rav_admin_user';
const SESSION_HOURS = 8;
const SESSION_MS = SESSION_HOURS * 60 * 60 * 1000;

interface AuthContextValue {
  user: AdminUser | null;
  login: (user: AdminUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const { user, expiresAt } = JSON.parse(stored);
      if (Date.now() > expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, expiresAt: Date.now() + SESSION_MS }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (user: AdminUser) => setUser(user);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
