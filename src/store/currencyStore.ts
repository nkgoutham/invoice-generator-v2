import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Define types
export type CurrencySettings = {
  id: string;
  user_id: string;
  preferred_currency: 'INR' | 'USD';
  usd_to_inr_rate: number;
  created_at: string;
};

interface CurrencyStoreState {
  currencySettings: CurrencySettings | null;
  loading: boolean;
  error: string | null;
  fetchCurrencySettings: (userId: string) => Promise<void>;
  updateCurrencySettings: (data: Partial<CurrencySettings>) => Promise<void>;
  convertCurrency: (amount: number, fromCurrency: 'USD' | 'INR', toCurrency: 'USD' | 'INR') => number;
}

export const useCurrencyStore = create<CurrencyStoreState>((set, get) => ({
  currencySettings: null,
  loading: false,
  error: null,

  fetchCurrencySettings: async (userId: string) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('currency_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If no settings found, don't show an error but create default settings
        if (error.code === 'PGRST116') {
          // Use default values
          set({ 
            currencySettings: {
              id: 'default',
              user_id: userId,
              preferred_currency: 'INR',
              usd_to_inr_rate: 85,
              created_at: new Date().toISOString()
            },
            error: null,
            loading: false 
          });
          return;
        }
        
        throw error;
      }
      
      set({ currencySettings: data as CurrencySettings, error: null });
    } catch (error: any) {
      console.error('Error fetching currency settings:', error);
      set({ 
        error: error.message || 'Failed to fetch currency settings',
        // Create default settings even on error
        currencySettings: {
          id: 'default',
          user_id: userId,
          preferred_currency: 'INR',
          usd_to_inr_rate: 85,
          created_at: new Date().toISOString()
        },
      });
    } finally {
      set({ loading: false });
    }
  },
  
  updateCurrencySettings: async (data: Partial<CurrencySettings>) => {
    set({ loading: true, error: null });
    const { currencySettings } = get();
    
    try {
      if (!currencySettings) {
        throw new Error('No currency settings found');
      }
      
      // If we have a default placeholder, create real settings
      if (currencySettings.id === 'default') {
        const { data: insertData, error: insertError } = await supabase
          .from('currency_settings')
          .insert({
            user_id: currencySettings.user_id,
            preferred_currency: data.preferred_currency || currencySettings.preferred_currency,
            usd_to_inr_rate: data.usd_to_inr_rate || currencySettings.usd_to_inr_rate
          })
          .select('*')
          .single();
        
        if (insertError) throw insertError;
        
        set({ 
          currencySettings: insertData as CurrencySettings,
          error: null 
        });
      } else {
        // Update existing settings
        const { data: updateData, error: updateError } = await supabase
          .from('currency_settings')
          .update({
            ...data
          })
          .eq('id', currencySettings.id)
          .select('*')
          .single();
        
        if (updateError) throw updateError;
        
        set({ 
          currencySettings: updateData as CurrencySettings,
          error: null 
        });
      }
      
      toast.success('Currency settings updated');
    } catch (error: any) {
      console.error('Error updating currency settings:', error);
      set({ error: error.message || 'Failed to update currency settings' });
      toast.error('Failed to update currency settings');
    } finally {
      set({ loading: false });
    }
  },
  
  convertCurrency: (amount: number, fromCurrency: 'USD' | 'INR', toCurrency: 'USD' | 'INR') => {
    const { currencySettings } = get();
    
    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Get the conversion rate - default to 85 if settings not loaded
    const rate = currencySettings?.usd_to_inr_rate || 85;
    
    // Convert from USD to INR
    if (fromCurrency === 'USD' && toCurrency === 'INR') {
      return amount * rate;
    }
    
    // Convert from INR to USD
    if (fromCurrency === 'INR' && toCurrency === 'USD') {
      return amount / rate;
    }
    
    // Fallback
    return amount;
  }
}));