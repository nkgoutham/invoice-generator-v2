import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Invoice, InvoiceItem } from '../lib/supabase';
import { generateInvoiceNumber } from '../utils/helpers';
import toast from 'react-hot-toast';
import { PaymentDetails } from '../types/invoice';

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  invoiceItems: InvoiceItem[];
  loading: boolean;
  error: string | null;
  fetchInvoices: (userId: string) => Promise<void>;
  fetchInvoice: (id: string) => Promise<void>;
  fetchInvoiceItems: (invoiceId: string) => Promise<void>;
  generateInvoiceNumber: (userId: string) => Promise<string>;
  createInvoice: (
    invoiceData: Partial<Invoice>,
    invoiceItems: Array<Partial<InvoiceItem>> | Array<{name: string, amount: number}>
  ) => Promise<Invoice | null>;
  updateInvoiceStatus: (id: string, status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partially_paid') => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  recordPayment: (id: string, paymentDetails: PaymentDetails) => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  selectedInvoice: null,
  invoiceItems: [],
  loading: false,
  error: null,

  fetchInvoices: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id (
            id,
            name,
            company_name,
            email,
            phone,
            billing_address
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ invoices: data || [] });
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchInvoice: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id (
            id,
            name,
            company_name,
            email,
            phone,
            billing_address,
            gst_number
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({ selectedInvoice: data });
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchInvoiceItems: async (invoiceId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      
      if (error) throw error;
      
      set({ invoiceItems: data || [] });
    } catch (error: any) {
      console.error('Error fetching invoice items:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  generateInvoiceNumber: async (userId: string) => {
    try {
      // Get the latest invoice for this user
      const { data: latestInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Generate a new invoice number based on the latest one or use a default format
      let nextInvoice;
      
      if (latestInvoice && latestInvoice.length > 0 && latestInvoice[0].invoice_number) {
        // Parse the existing format and increment
        const currentNumber = latestInvoice[0].invoice_number;
        const parts = currentNumber.split('-');
        
        if (parts.length >= 4) {
          // Format: INV-YYYY-MM-XXX
          const currentYear = parts[1];
          const currentMonth = parts[2];
          const currentSeq = parseInt(parts[3], 10);
          
          const now = new Date();
          const year = now.getFullYear().toString();
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          
          if (currentYear === year && currentMonth === month) {
            // Same month, increment the sequence
            const nextSeq = (currentSeq + 1).toString().padStart(3, '0');
            nextInvoice = `INV-${year}-${month}-${nextSeq}`;
          } else {
            // New month, reset sequence
            nextInvoice = `INV-${year}-${month}-001`;
          }
        } else {
          nextInvoice = generateInvoiceNumber('INV', userId);
        }
      } else {
        nextInvoice = generateInvoiceNumber('INV', userId);
      }
      
      return nextInvoice;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return generateInvoiceNumber('INV', userId);
    }
  },

  createInvoice: async (invoiceData, invoiceItems) => {
    try {
      set({ loading: true, error: null });
      
      // First, insert the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      if (invoice) {
        // Format items based on engagement type
        let formattedItems;
        
        if (invoiceData.engagement_type === 'milestone') {
          // For milestone-based invoices
          formattedItems = (invoiceItems as Array<{name: string, amount: number}>).map(milestone => ({
            invoice_id: invoice.id,
            milestone_name: milestone.name,
            description: null, // Not required for milestones
            quantity: 1,
            rate: milestone.amount,
            amount: milestone.amount
          }));
        } else if (invoiceData.engagement_type === 'retainership') {
          // For retainership-based invoices
          const item = invoiceItems[0] as Partial<InvoiceItem>;
          formattedItems = [{
            invoice_id: invoice.id,
            description: item.description || 'Monthly Retainer Fee',
            quantity: 1,
            rate: item.rate || 0,
            amount: item.amount || 0,
            retainer_period: (invoiceData as any).retainer_period || null
          }];
        } else if (invoiceData.engagement_type === 'project') {
          // For project-based invoices
          const item = invoiceItems[0] as Partial<InvoiceItem>;
          formattedItems = [{
            invoice_id: invoice.id,
            description: item.description || 'Project Fee',
            quantity: 1,
            rate: item.rate || 0,
            amount: item.amount || 0,
            project_description: (invoiceData as any).project_description || null
          }];
        } else {
          // For service/hourly-based invoices or default case
          formattedItems = (invoiceItems as Array<Partial<InvoiceItem>>).map(item => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          }));
        }
        
        // Then, insert the invoice items
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(formattedItems);
        
        if (itemsError) throw itemsError;
        
        // Fetch the updated invoices list
        if (invoiceData.user_id) {
          await get().fetchInvoices(invoiceData.user_id);
        }
        
        return invoice;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      set({ error: error.message });
      toast.error('Failed to create invoice: ' + error.message);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateInvoiceStatus: async (id, status) => {
    try {
      set({ loading: true, error: null });
      
      let updateData: any = { status };
      
      // If marking as paid, set the payment date to today
      if (status === 'paid' && !get().selectedInvoice?.payment_date) {
        updateData.payment_date = new Date().toISOString().split('T')[0];
      }
      
      // If marking as sent and the invoice is currently draft, set the issue_date to today if it's not already set
      if (status === 'sent' && get().selectedInvoice?.status === 'draft') {
        if (!get().selectedInvoice?.issue_date) {
          updateData.issue_date = new Date().toISOString().split('T')[0];
        }
      }
      
      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      const updatedInvoice = { ...get().selectedInvoice, ...updateData } as Invoice;
      set({ selectedInvoice: updatedInvoice });
      
      // Update the invoices list too
      const updatedInvoices = get().invoices.map(invoice => 
        invoice.id === id ? { ...invoice, ...updateData } : invoice
      );
      set({ invoices: updatedInvoices });
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  deleteInvoice: async (id) => {
    try {
      set({ loading: true, error: null });
      
      // First, delete all invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
      
      if (itemsError) throw itemsError;
      
      // Then, delete the invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the invoices list
      const updatedInvoices = get().invoices.filter(invoice => invoice.id !== id);
      set({ invoices: updatedInvoices, selectedInvoice: null });
      
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  recordPayment: async (id, paymentDetails) => {
    try {
      set({ loading: true, error: null });
      
      const { selectedInvoice } = get();
      if (!selectedInvoice) throw new Error('Invoice not found');
      
      const { payment_date, payment_method, payment_reference, amount, is_partially_paid } = paymentDetails;
      
      // Determine if this is a full or partial payment
      let updateData: any = {
        payment_date,
        payment_method,
        payment_reference
      };
      
      if (is_partially_paid) {
        updateData.status = 'partially_paid';
        updateData.is_partially_paid = true;
        updateData.partially_paid_amount = amount;
      } else {
        updateData.status = 'paid';
        updateData.is_partially_paid = false;
      }
      
      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      const updatedInvoice = { ...get().selectedInvoice, ...updateData } as Invoice;
      set({ selectedInvoice: updatedInvoice });
      
      // Update the invoices list too
      const updatedInvoices = get().invoices.map(invoice => 
        invoice.id === id ? { ...invoice, ...updateData } : invoice
      );
      set({ invoices: updatedInvoices });
      
      return;
    } catch (error: any) {
      console.error('Error recording payment:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));