import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'מנהל' | 'רב' | 'צוות';
}

interface AuthContextValue {
  user: AdminUser | null;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [airtableUser, setAirtableUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !clerkUser) {
      setAirtableUser(null);
      return;
    }

    const email = clerkUser.primaryEmailAddress?.emailAddress ?? '';
    if (!email) return;

    fetch(`/api/auth-user?email=${encodeURIComponent(email)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setAirtableUser(data ?? null))
      .catch(() => setAirtableUser(null));
  }, [isLoaded, isSignedIn, clerkUser]);

  const logout = () => signOut();

  return (
    <AuthContext.Provider value={{
      user: airtableUser,
      logout,
      isAuthenticated: !!isSignedIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
