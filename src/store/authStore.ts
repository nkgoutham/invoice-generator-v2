import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  
  init: async () => {
    try {
      set({ loading: true });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Don't set error here to avoid showing errors on initial load
      // Just log out the user if there's a session issue
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },
  
  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          set({ error: 'Invalid email or password' });
          return false;
        } else {
          set({ error: error.message || 'Failed to sign in' });
          return false;
        }
      }
      
      set({ user: data.user, isAuthenticated: true });
      return true;
    } catch (error: any) {
      console.error('Sign in error:', error);
      set({ error: error.message || 'Failed to sign in' });
      return false;
    } finally {
      set({ loading: false });
    }
  },
  
  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Note: User will need to verify email if enabled in Supabase
      set({ user: data.user });
    } catch (error: any) {
      console.error('Sign up error:', error);
      set({ error: error.message || 'Failed to sign up' });
    } finally {
      set({ loading: false });
    }
  },
  
  signOut: async () => {
    try {
      set({ loading: true });
      
      await supabase.auth.signOut();
      
      set({ user: null, isAuthenticated: false });
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Even if there's an error on sign out, reset the user state
      set({ user: null, isAuthenticated: false, error: null });
    } finally {
      set({ loading: false });
    }
  },
  
  resetPassword: async (email) => {
    try {
      set({ loading: true, error: null });
      
      // Include the site URL to redirect back to after reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Reset password error:', error);
      set({ error: error.message || 'Failed to reset password' });
      throw error; // Re-throw to handle in component
    } finally {
      set({ loading: false });
    }
  },
  
  updatePassword: async (newPassword) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Update password error:', error);
      set({ error: error.message || 'Failed to update password' });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));