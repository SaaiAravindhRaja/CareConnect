import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, getCaregiver } from '../lib/supabase';
import type { Caregiver, AuthState } from '../types';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCaregiver: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    caregiver: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState((prev) => ({
          ...prev,
          user: { id: session.user.id, email: session.user.email || '' },
        }));
        loadCaregiver(session.user.id);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setState((prev) => ({
          ...prev,
          user: { id: session.user.id, email: session.user.email || '' },
        }));
        loadCaregiver(session.user.id);
      } else {
        setState({
          user: null,
          caregiver: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCaregiver = async (userId: string) => {
    try {
      const caregiver = await getCaregiver(userId);
      setState((prev) => ({
        ...prev,
        caregiver: caregiver as Caregiver,
        loading: false,
      }));
    } catch {
      // Caregiver profile might not exist yet
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        await loadCaregiver(data.user.id);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Get current origin for email confirmation redirect
      const redirectTo = `${window.location.origin}/dashboard`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from signup');

      // Create caregiver profile
      const { error: profileError } = await supabase.from('caregivers').insert({
        user_id: data.user.id,
        name,
        email,
      });

      if (profileError) throw profileError;

      await loadCaregiver(data.user.id);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState({
        user: null,
        caregiver: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
      throw error;
    }
  };

  const refreshCaregiver = async () => {
    if (state.user) {
      await loadCaregiver(state.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        refreshCaregiver,
      }}
    >
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
