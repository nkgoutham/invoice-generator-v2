import { create } from 'zustand';
import { supabase, RecurringInvoice } from '../lib/supabase';
import { RecurringInvoiceFormData } from '../types/invoice';

interface RecurringInvoiceState {
  recurringInvoices: RecurringInvoice[];
  selectedRecurringInvoice: RecurringInvoice | null;
  loading: boolean;
  error: string | null;
  fetchRecurringInvoices: (userId: string) => Promise<void>;
  fetchRecurringInvoice: (id: string) => Promise<void>;
  createRecurringInvoice: (data: RecurringInvoiceFormData, userId: string, clientId: string) => Promise<RecurringInvoice | null>;
  updateRecurringInvoice: (id: string, data: Partial<RecurringInvoice>) => Promise<void>;
  toggleRecurringInvoiceStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
  deleteRecurringInvoice: (id: string) => Promise<void>;
}

export const useRecurringInvoiceStore = create<RecurringInvoiceState>((set, get) => ({
  recurringInvoices: [],
  selectedRecurringInvoice: null,
  loading: false,
  error: null,
  
  fetchRecurringInvoices: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('recurring_invoices')
        .select('*, clients(name, company_name)')
        .eq('user_id', userId)
        .order('next_issue_date', { ascending: true });
      
      if (error) throw error;
      
      set({ recurringInvoices: data as unknown as RecurringInvoice[] });
    } catch (error: any) {
      console.error('Error fetching recurring invoices:', error);
      set({ error: error.message || 'Failed to fetch recurring invoices' });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchRecurringInvoice: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('recurring_invoices')
        .select('*, clients(name, company_name, billing_address, email, phone, gst_number)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({ selectedRecurringInvoice: data as unknown as RecurringInvoice });
    } catch (error: any) {
      console.error('Error fetching recurring invoice:', error);
      set({ error: error.message || 'Failed to fetch recurring invoice' });
    } finally {
      set({ loading: false });
    }
  },
  
  createRecurringInvoice: async (data: RecurringInvoiceFormData, userId: string, clientId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Extract base invoice data to create the template
      const { 
        title,
        frequency,
        start_date,
        end_date,
        auto_send,
        ...invoiceData
      } = data;
      
      // Prepare template data
      const templateData = {
        invoice_data: {
          ...invoiceData,
          status: 'draft',
          user_id: userId,
          client_id: clientId,
        },
        invoice_items: data.engagement_type === 'milestone' && data.milestones 
          ? data.milestones.map(milestone => ({
              description: milestone.name,
              quantity: 1,
              rate: milestone.amount,
              amount: milestone.amount,
              milestone_name: milestone.name,
            }))
          : data.items
      };
      
      // Calculate next_issue_date from start_date and frequency
      let nextIssueDate = new Date(start_date);
      // This will be replaced by the database function in production
      switch(frequency) {
        case 'weekly':
          nextIssueDate.setDate(nextIssueDate.getDate() + 7);
          break;
        case 'monthly':
          nextIssueDate.setMonth(nextIssueDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextIssueDate.setMonth(nextIssueDate.getMonth() + 3);
          break;
        case 'yearly':
          nextIssueDate.setFullYear(nextIssueDate.getFullYear() + 1);
          break;
      }
      
      // Convert to YYYY-MM-DD
      const nextIssueDateStr = nextIssueDate.toISOString().split('T')[0];
      
      // Create recurring invoice
      const { data: createdInvoice, error } = await supabase
        .from('recurring_invoices')
        .insert({
          user_id: userId,
          client_id: clientId,
          title,
          frequency,
          start_date,
          end_date: end_date || null,
          next_issue_date: nextIssueDateStr,
          template_data: templateData,
          status: 'active',
          auto_send
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the store state with the new recurring invoice
      set((state) => ({
        recurringInvoices: [...state.recurringInvoices, createdInvoice as RecurringInvoice]
      }));
      
      return createdInvoice as RecurringInvoice;
    } catch (error: any) {
      console.error('Error creating recurring invoice:', error);
      set({ error: error.message || 'Failed to create recurring invoice' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  updateRecurringInvoice: async (id: string, data: Partial<RecurringInvoice>) => {
    try {
      set({ loading: true, error: null });
      
      const { data: updatedInvoice, error } = await supabase
        .from('recurring_invoices')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the store state
      set((state) => ({
        recurringInvoices: state.recurringInvoices.map(ri => 
          ri.id === id ? (updatedInvoice as RecurringInvoice) : ri
        ),
        selectedRecurringInvoice: state.selectedRecurringInvoice?.id === id 
          ? (updatedInvoice as RecurringInvoice) 
          : state.selectedRecurringInvoice
      }));
    } catch (error: any) {
      console.error('Error updating recurring invoice:', error);
      set({ error: error.message || 'Failed to update recurring invoice' });
    } finally {
      set({ loading: false });
    }
  },
  
  toggleRecurringInvoiceStatus: async (id: string, status: 'active' | 'inactive') => {
    await get().updateRecurringInvoice(id, { status });
  },
  
  deleteRecurringInvoice: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('recurring_invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the store state
      set((state) => ({
        recurringInvoices: state.recurringInvoices.filter(ri => ri.id !== id),
        selectedRecurringInvoice: state.selectedRecurringInvoice?.id === id 
          ? null 
          : state.selectedRecurringInvoice
      }));
    } catch (error: any) {
      console.error('Error deleting recurring invoice:', error);
      set({ error: error.message || 'Failed to delete recurring invoice' });
    } finally {
      set({ loading: false });
    }
  },
}));