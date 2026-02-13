import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLog';

type UserRole = 'admin' | 'hr' | 'employee';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        if (session?.user) {
          await loadUserData(session.user);
        }
        setLoading(false);
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser: User) => {
    try {
      // Try to get role from JWT metadata first
      const role = authUser.app_metadata?.role as UserRole | undefined;

      if (role) {
        // Role is available in JWT, query for employee_id only
        const { data, error } = await supabase
          .from('users')
          .select('employee_id')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading user employee_id:', error);
        }

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: role,
          employeeId: (data as any)?.employee_id || null,
        });
      } else {
        // Role not in JWT - need to refresh session to get updated JWT
        console.warn('Role not found in JWT, refreshing session...');

        // Query for user data from database
        const { data, error } = await supabase
          .from('users')
          .select('role, employee_id')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading user data:', error);
          // Set minimal user data
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            role: 'employee' as UserRole,
            employeeId: null,
          });
          return;
        }

        if (data) {
          // User data found, set it
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            role: (data as any).role as UserRole,
            employeeId: (data as any).employee_id,
          });

          // Refresh session to get updated JWT with role
          console.log('Refreshing session to update JWT...');
          await supabase.auth.refreshSession();
        } else {
          console.warn('No user data found');
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            role: 'employee' as UserRole,
            employeeId: null,
          });
        }
      }
    } catch (error) {
      console.error('Unexpected error in loadUserData:', error);
      // Set user with minimal data to prevent auth loop
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        role: 'employee' as UserRole,
        employeeId: null,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // Log login activity
    if (data.user) {
      logActivity(data.user.id, 'user_login', 'user', data.user.id, {
        email: data.user.email,
      });
    }
  };

  const signOut = async () => {
    // Log logout activity before signing out
    if (user) {
      logActivity(user.id, 'user_logout', 'user', user.id);
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
