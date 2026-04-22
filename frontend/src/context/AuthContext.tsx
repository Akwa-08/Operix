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
  refreshUser: () => Promise<void>;
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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session error:", error.message);
        if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
           supabase.auth.signOut();
        }
      }
      setSession(session);
      setUser(parseUser(session?.user ?? null));
      setLoading(false);
    });
 
    // Listen for login / logout / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else {
        setSession(session);
        setUser(parseUser(session?.user ?? null));
      }
      setLoading(false);
    });
 
    return () => subscription.unsubscribe();
  }, []);
 
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshUser = async () => {
    try {
      // 1. Refresh auth session + get fresh user from server
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!freshUser) return;

      // 2. Also fetch from public.users for the most current name
      //    (auth metadata may be cached by Supabase until next token refresh)
      const { data: profile } = await supabase
        .from('users')
        .select('first_name, last_name, role')
        .eq('id', freshUser.id)
        .single();

        const nextUser: AuthUser = {
          id: freshUser.id,
          email: freshUser.email ?? '',
          role: (profile.role as UserRole) || (freshUser.user_metadata?.role as UserRole) || 'customer',
          firstName: profile.first_name ?? freshUser.user_metadata?.first_name ?? null,
          lastName: profile.last_name ?? freshUser.user_metadata?.last_name ?? null,
        };

        // Defensive check: only update if data actually changed to reduce redundant re-renders
        // that can trigger noisy browser extension "message channel closed" errors.
        if (JSON.stringify(user) !== JSON.stringify(nextUser)) {
          setUser(nextUser);
        }
    } catch (err: any) {
      console.error("Failed to refresh user:", err.message);
      if (err.message && (err.message.includes("Refresh Token Not Found") || err.message.includes("Invalid Refresh Token"))) {
        await signOut();
      }
    }
  };
 
  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshUser }}>
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

