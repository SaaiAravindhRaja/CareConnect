import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, getCaregiver } from '../lib/supabase';
import { seedDemoData } from '../lib/seedDemoData';
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
      console.log('Caregiver profile not found, attempting auto-creation...');
      // Try to auto-create profile if missing
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newCaregiver } = await supabase
            .from('caregivers')
            .insert({
              user_id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Caregiver',
              email: user.email
            })
            .select()
            .single();

          if (newCaregiver) {
            setState((prev) => ({
              ...prev,
              caregiver: newCaregiver as Caregiver,
              loading: false,
            }));
            return;
          }
        }
      } catch (createError) {
        console.error('Failed to auto-create caregiver profile:', createError);
      }

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
      const { data: caregiverData, error: profileError } = await supabase
        .from('caregivers')
        .insert({
          user_id: data.user.id,
          name,
          email,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Automatically seed demo data for new users
      if (caregiverData) {
        try {
          console.log('Auto-seeding demo data for new user...');
          await seedDemoData(data.user.id, caregiverData.id);
          console.log('✅ Demo data seeded successfully');
        } catch (seedError) {
          console.error('Failed to seed demo data:', seedError);
          // Don't throw - seeding failure shouldn't prevent signup
        }
      }

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
