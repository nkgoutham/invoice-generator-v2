import { create } from 'zustand';
import { supabase, Profile, BankingInfo } from '../lib/supabase';

interface ProfileState {
  profile: Profile | null;
  bankingInfo: BankingInfo | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  fetchBankingInfo: (userId: string) => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  updateBankingInfo: (bankingData: Partial<BankingInfo>) => Promise<void>;
  uploadLogo: (file: File, userId: string) => Promise<string | null>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  bankingInfo: null,
  loading: false,
  error: null,
  
  fetchProfile: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Changed from single() to maybeSingle() to handle case when no profile exists
      
      if (error) throw error;
      
      // If no profile exists, we'll get null which is handled by our state
      set({ profile: data as Profile });
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      set({ error: error.message || 'Failed to fetch profile' });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchBankingInfo: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('banking_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Also changed to maybeSingle() for consistency
      
      if (error) throw error;
      
      set({ bankingInfo: data as BankingInfo });
    } catch (error: any) {
      console.error('Fetch banking info error:', error);
      set({ error: error.message || 'Failed to fetch banking information' });
    } finally {
      set({ loading: false });
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      set({ loading: true, error: null });
      
      const { profile } = get();
      if (!profile || !profile.user_id) {
        throw new Error('Profile not loaded');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', profile.user_id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ profile: data as Profile });
    } catch (error: any) {
      console.error('Update profile error:', error);
      set({ error: error.message || 'Failed to update profile' });
    } finally {
      set({ loading: false });
    }
  },
  
  updateBankingInfo: async (bankingData) => {
    try {
      set({ loading: true, error: null });
      
      const { profile } = get();
      if (!profile || !profile.user_id) {
        throw new Error('Profile not loaded');
      }
      
      const { data, error } = await supabase
        .from('banking_info')
        .update(bankingData)
        .eq('user_id', profile.user_id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ bankingInfo: data as BankingInfo });
    } finally {
      set({ loading: false });
    }
  },
  
  uploadLogo: async (file, userId) => {
    try {
      set({ loading: true, error: null });
      
      // Add size restriction
      if (file.size > 1024 * 1024) { // 1MB size limit
        throw new Error('Logo file size must be less than 1MB');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Logo must be a valid image format (JPEG, PNG, GIF, WEBP)');
      }

      // Generate a unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/logo_${timestamp}.${fileExt}`;
      
      // Upload file with no-cache headers
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '0', // No cache
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL with cache-busting query parameter
      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);
      
      // Add cache-busting parameter
      const publicUrl = `${data.publicUrl}?t=${timestamp}`;
      
      // Update profile with new logo URL directly in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Fetch the updated profile to ensure state is in sync
      await get().fetchProfile(userId);
      
      return publicUrl;
    } catch (error: any) {
      console.error('Upload logo error:', error);
      set({ error: error.message || 'Failed to upload logo' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));