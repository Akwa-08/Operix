// frontend/src/context/AuthContext.tsx
 
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../config/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
 
export type UserRole = 'admin' | 'cashier' | 'designer' | 'production' | 'customer';
 
interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
}
 
interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
 
const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
const parseUser = (supabaseUser: User | null): AuthUser | null => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    role: (supabaseUser.user_metadata?.role as UserRole) || 'customer',
    firstName: supabaseUser.user_metadata?.first_name ?? null,
    lastName: supabaseUser.user_metadata?.last_name ?? null,
  };
};
 
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    // Load existing session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(parseUser(session?.user ?? null));
      setLoading(false);
    });
 
    // Listen for login / logout / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(parseUser(session?.user ?? null));
      setLoading(false);
    });
 
    return () => subscription.unsubscribe();
  }, []);
 
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };
 
  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
 
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
};

