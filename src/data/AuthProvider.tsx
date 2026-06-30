import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserProfile } from '../domain/types';
import * as auth from './auth';

interface AuthValue {
  readonly user: UserProfile | null;
  readonly ready: boolean;
  login: (email: string, password: string) => void;
  register: (input: { email: string; password: string; name: string; phone?: string }) => void;
  logout: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  changePassword: (current: string, next: string) => void;
  resetPassword: (email: string, newPassword: string) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    auth.ensureDemoUser();
    setUser(auth.getCurrentUser());
    setReady(true);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      login: (email, password) => setUser(auth.loginUser(email, password)),
      register: (input) => setUser(auth.registerUser(input)),
      logout: () => {
        auth.logoutUser();
        setUser(null);
      },
      updateProfile: (patch) => setUser(auth.updateProfile(patch)),
      changePassword: (current, next) => auth.changePassword(current, next),
      resetPassword: (email, newPassword) => auth.resetPassword(email, newPassword),
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
