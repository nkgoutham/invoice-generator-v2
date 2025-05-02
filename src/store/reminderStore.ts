import { create } from 'zustand';
import { supabase, InvoiceReminder } from '../lib/supabase';
import { InvoiceReminderFormData } from '../types/invoice';

interface ReminderState {
  reminderSettings: InvoiceReminder | null;
  loading: boolean;
  error: string | null;
  fetchReminderSettings: (userId: string) => Promise<void>;
  createReminderSettings: (data: InvoiceReminderFormData, userId: string) => Promise<InvoiceReminder | null>;
  updateReminderSettings: (id: string, data: Partial<InvoiceReminder>) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set) => ({
  reminderSettings: null,
  loading: false,
  error: null,
  
  fetchReminderSettings: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoice_reminders')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      set({ reminderSettings: data as InvoiceReminder });
    } catch (error: any) {
      console.error('Error fetching reminder settings:', error);
      set({ error: error.message || 'Failed to fetch reminder settings' });
    } finally {
      set({ loading: false });
    }
  },
  
  createReminderSettings: async (data: InvoiceReminderFormData, userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data: createdSettings, error } = await supabase
        .from('invoice_reminders')
        .insert({
          user_id: userId,
          days_before_due: data.days_before_due,
          days_after_due: data.days_after_due,
          reminder_subject: data.reminder_subject,
          reminder_message: data.reminder_message,
          enabled: data.enabled
        })
        .select()
        .single();
      
      if (error) throw error;
      
      set({ reminderSettings: createdSettings as InvoiceReminder });
      
      return createdSettings as InvoiceReminder;
    } catch (error: any) {
      console.error('Error creating reminder settings:', error);
      set({ error: error.message || 'Failed to create reminder settings' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  updateReminderSettings: async (id: string, data: Partial<InvoiceReminder>) => {
    try {
      set({ loading: true, error: null });
      
      const { data: updatedSettings, error } = await supabase
        .from('invoice_reminders')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ reminderSettings: updatedSettings as InvoiceReminder });
    } catch (error: any) {
      console.error('Error updating reminder settings:', error);
      set({ error: error.message || 'Failed to update reminder settings' });
    } finally {
      set({ loading: false });
    }
  }
}));