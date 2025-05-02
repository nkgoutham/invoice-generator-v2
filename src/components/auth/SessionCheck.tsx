import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// This component can be rendered anywhere to periodically check
// session status and handle issues gracefully
const SessionCheck = () => {
  const { signOut } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      // If there's an error or no session when there should be one
      if (error || (localStorage.getItem('supabase.auth.token') && !data.session)) {
        console.error('Session check failed:', error);
        // Clear any invalid session data
        signOut();
        toast.error('Your session has expired. Please sign in again.');
      }
    };
    
    // Check once on mount
    checkSession();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // User signed out or was deleted
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed - all good
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [signOut]);

  return null; // This component doesn't render anything
};

export default SessionCheck;