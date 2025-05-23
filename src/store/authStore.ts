import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { navigate } from '../utils/navigation';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  init: async () => {
    try {
      set({ loading: true, error: null });
      
      // Check if session exists and is valid
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data?.session) {
        // Check if the session is about to expire
        const expiresAt = data.session.expires_at;
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const timeToExpireSec = expiresAt - nowInSeconds;
        
        // If token expires in less than 5 minutes (300 seconds), refresh it
        if (timeToExpireSec < 300) {
          await get().refreshSession();
        }
        
        // Set up listener for auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            set({ user: session.user, isAuthenticated: true });
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false });
          } else if (event === 'TOKEN_REFRESHED' && session) {
            set({ user: session.user, isAuthenticated: true });
          } else if (event === 'USER_UPDATED' && session) {
            set({ user: session.user, isAuthenticated: true });
          }
        });
        
        set({ 
          user: data.session.user,
          isAuthenticated: true
        });
      } else {
        set({ 
          user: null,
          isAuthenticated: false
        });
      }
    } catch (error: any) {
      console.error('Auth initialization error:', error);
      
      // Handle session not found error specifically
      if (error.message.includes('session_not_found')) {
        set({ 
          user: null,
          isAuthenticated: false,
          error: 'Your session has expired. Please log in again.'
        });
      } else {
        set({ error: error.message });
      }
    } finally {
      set({ loading: false });
    }
  },
  
  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ 
        user: data.user,
        isAuthenticated: true
      });
    } catch (error: any) {
      console.error('Login error:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  register: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // If email confirmation is required, we don't set the user as authenticated yet
      if (data.user && !data.session) {
        set({ 
          user: data.user,
          isAuthenticated: false,
          error: 'Please check your email for a confirmation link.'
        });
      } else if (data.user && data.session) {
        set({ 
          user: data.user,
          isAuthenticated: true
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  logout: async () => {
    try {
      set({ loading: true });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ 
        user: null,
        isAuthenticated: false 
      });
      
      // Redirect to login after logout
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  resetPassword: async (email) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return;
    } catch (error: any) {
      console.error('Reset password error:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  setPassword: async (password) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) throw error;
      
      // After updating password, refresh the session
      await get().refreshSession();
    } catch (error: any) {
      console.error('Set password error:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        set({ 
          user: data.session.user,
          isAuthenticated: true
        });
        return true;
      } else {
        // Session couldn't be refreshed, user needs to login again
        set({ 
          user: null,
          isAuthenticated: false
        });
        
        // Clear any stored session data
        await supabase.auth.signOut();
        
        return false;
      }
    } catch (error: any) {
      console.error('Session refresh error:', error);
      
      // Session refresh failed, clear auth state
      set({ 
        user: null,
        isAuthenticated: false,
        error: 'Your session expired. Please log in again.'
      });
      
      // Show toast notification
      toast.error('Your session has expired. Please log in again.');
      
      // Redirect to login page
      navigate('/login');
      
      return false;
    }
  },
  
  clearError: () => set({ error: null }),
}));

// Add an interceptor to handle auth errors globally
export const setupAuthErrorInterceptor = () => {
  // This is a custom function to be called in App.tsx or somewhere similar
  // It adds a global error handler for Supabase auth errors
  
  const handleAuthError = async (error: any) => {
    // Check if this is a session not found error
    if (
      error.status === 403 &&
      error.body &&
      typeof error.body === 'string' &&
      error.body.includes('session_not_found')
    ) {
      console.log('Auth session error detected, attempting refresh...');
      
      // Try to refresh the session
      const refreshed = await useAuthStore.getState().refreshSession();
      
      // If refresh failed, redirect to login
      if (!refreshed) {
        toast.error('Your session has expired. Please log in again.');
        navigate('/login');
      }
    }
  };
  
  // Add this error handler to window global error event
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('Supabase request failed')) {
      handleAuthError(event.error);
    }
  });
  
  // Add unhandled rejection handler for promise errors
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason && 
      typeof event.reason === 'object' && 
      event.reason.message && 
      event.reason.message.includes('Supabase request failed')
    ) {
      handleAuthError(event.reason);
    }
  });
};