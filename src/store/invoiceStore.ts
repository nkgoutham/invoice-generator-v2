import { create } from 'zustand';
import { supabase, Invoice, InvoiceItem } from '../lib/supabase';
import { generateInvoiceNumber } from '../utils/helpers';
import { PaymentDetails } from '../types/invoice';

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  invoiceItems: InvoiceItem[];
  loading: boolean;
  error: string | null;
  fetchInvoices: (userId: string) => Promise<void>;
  fetchInvoice: (invoiceId: string) => Promise<void>;
  fetchInvoiceItems: (invoiceId: string) => Promise<void>;
  createInvoice: (invoice: Partial<Invoice>, items: Partial<InvoiceItem>[]) => Promise<Invoice | null>;
  updateInvoice: (invoiceId: string, updates: Partial<Invoice>) => Promise<void>;
  updateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  createInvoiceItem: (item: Partial<InvoiceItem>) => Promise<void>;
  updateInvoiceItem: (itemId: string, updates: Partial<InvoiceItem>) => Promise<void>;
  deleteInvoiceItem: (itemId: string) => Promise<void>;
  generateInvoiceNumber: (userId: string) => Promise<string>;
  recordPayment: (invoiceId: string, paymentDetails: PaymentDetails) => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  selectedInvoice: null,
  invoiceItems: [],
  loading: false,
  error: null,
  
  fetchInvoices: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(name, company_name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ invoices: data as unknown as Invoice[] });
    } catch (error: any) {
      console.error('Fetch invoices error:', error);
      set({ error: error.message || 'Failed to fetch invoices' });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchInvoice: async (invoiceId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(name, company_name, billing_address, email, phone, gst_number)')
        .eq('id', invoiceId)
        .single();
      
      if (error) throw error;
      
      set({ selectedInvoice: data as unknown as Invoice });
    } catch (error: any) {
      console.error('Fetch invoice error:', error);
      set({ error: error.message || 'Failed to fetch invoice' });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchInvoiceItems: async (invoiceId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*, tasks(name)')
        .eq('invoice_id', invoiceId);
      
      if (error) throw error;
      
      set({ invoiceItems: data as unknown as InvoiceItem[] });
    } catch (error: any) {
      console.error('Fetch invoice items error:', error);
      set({ error: error.message || 'Failed to fetch invoice items' });
    } finally {
      set({ loading: false });
    }
  },
  
  createInvoice: async (invoice, items) => {
    try {
      set({ loading: true, error: null });
      
      // Check if this invoice number already exists for this user
      const { data: existingInvoice, error: checkError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', invoice.user_id)
        .eq('invoice_number', invoice.invoice_number)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let createdInvoice: Invoice;
      
      if (existingInvoice) {
        // Update existing invoice instead of creating a new one
        const { data: updatedInvoice, error: updateError } = await supabase
          .from('invoices')
          .update({
            client_id: invoice.client_id,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            status: invoice.status,
            subtotal: invoice.subtotal,
            tax: invoice.tax,
            total: invoice.total,
            notes: invoice.notes,
            currency: invoice.currency,
            engagement_type: invoice.engagement_type,
            tax_percentage: invoice.tax_percentage,
            reverse_calculation: invoice.reverse_calculation
          })
          .eq('id', existingInvoice.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        createdInvoice = updatedInvoice as Invoice;
        
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', existingInvoice.id);
        
        if (deleteError) throw deleteError;
        
      } else {
        // Create new invoice
        const { data: newInvoice, error: createError } = await supabase
          .from('invoices')
          .insert([invoice])
          .select()
          .single();
        
        if (createError) throw createError;
        
        createdInvoice = newInvoice as Invoice;
      }
      
      // Add items with the invoice ID
      if (items.length > 0) {
        const itemsWithInvoiceId = items.map(item => ({
          ...item,
          invoice_id: createdInvoice.id
        }));
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsWithInvoiceId);
        
        if (itemsError) throw itemsError;
      }
      
      // Update the invoices list in state
      set((state) => {
        // Remove the existing invoice from the list if it was updated
        const filteredInvoices = existingInvoice 
          ? state.invoices.filter(inv => inv.id !== existingInvoice.id)
          : state.invoices;
          
        return { 
          invoices: [createdInvoice, ...filteredInvoices],
          selectedInvoice: createdInvoice 
        };
      });
      
      return createdInvoice;
    } catch (error: any) {
      console.error('Create invoice error:', error);
      set({ error: error.message || 'Failed to create invoice' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  updateInvoice: async (invoiceId, updates) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedInvoice = data as Invoice;
      
      set((state) => ({ 
        invoices: state.invoices.map(inv => 
          inv.id === invoiceId ? updatedInvoice : inv
        ),
        selectedInvoice: state.selectedInvoice?.id === invoiceId 
          ? updatedInvoice 
          : state.selectedInvoice
      }));
    } catch (error: any) {
      console.error('Update invoice error:', error);
      set({ error: error.message || 'Failed to update invoice' });
    } finally {
      set({ loading: false });
    }
  },
  
  updateInvoiceStatus: async (invoiceId, status) => {
    await get().updateInvoice(invoiceId, { status });
  },

  recordPayment: async (invoiceId, paymentDetails) => {
    try {
      set({ loading: true, error: null });

      const { payment_date, payment_method, payment_reference, amount, is_partially_paid } = paymentDetails;
      
      const { selectedInvoice } = get();
      if (!selectedInvoice) throw new Error('No invoice selected');

      const updateData: Partial<Invoice> = {
        payment_date,
        payment_method,
        payment_reference,
      };

      // If partial payment
      if (is_partially_paid) {
        updateData.status = 'partially_paid';
        updateData.is_partially_paid = true;
        updateData.partially_paid_amount = amount;
      } else {
        // Full payment
        updateData.status = 'paid';
        updateData.is_partially_paid = false;
      }

      await get().updateInvoice(invoiceId, updateData);
    } catch (error: any) {
      console.error('Record payment error:', error);
      set({ error: error.message || 'Failed to record payment' });
    } finally {
      set({ loading: false });
    }
  },
  
  deleteInvoice: async (invoiceId) => {
    try {
      set({ loading: true, error: null });
      
      // Delete invoice items first (cascade should handle this, but being explicit)
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);
      
      if (itemsError) throw itemsError;
      
      // Then delete the invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);
      
      if (error) throw error;
      
      set((state) => ({ 
        invoices: state.invoices.filter(inv => inv.id !== invoiceId),
        selectedInvoice: state.selectedInvoice?.id === invoiceId 
          ? null 
          : state.selectedInvoice,
        invoiceItems: state.selectedInvoice?.id === invoiceId 
          ? [] 
          : state.invoiceItems
      }));
    } catch (error: any) {
      console.error('Delete invoice error:', error);
      set({ error: error.message || 'Failed to delete invoice' });
    } finally {
      set({ loading: false });
    }
  },
  
  createInvoiceItem: async (item) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoice_items')
        .insert([item])
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        invoiceItems: [...state.invoiceItems, data as InvoiceItem] 
      }));
    } catch (error: any) {
      console.error('Create invoice item error:', error);
      set({ error: error.message || 'Failed to create invoice item' });
    } finally {
      set({ loading: false });
    }
  },
  
  updateInvoiceItem: async (itemId, updates) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('invoice_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        invoiceItems: state.invoiceItems.map(item => 
          item.id === itemId ? (data as InvoiceItem) : item
        ) 
      }));
    } catch (error: any) {
      console.error('Update invoice item error:', error);
      set({ error: error.message || 'Failed to update invoice item' });
    } finally {
      set({ loading: false });
    }
  },
  
  deleteInvoiceItem: async (itemId) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      set((state) => ({ 
        invoiceItems: state.invoiceItems.filter(item => item.id !== itemId) 
      }));
    } catch (error: any) {
      console.error('Delete invoice item error:', error);
      set({ error: error.message || 'Failed to delete invoice item' });
    } finally {
      set({ loading: false });
    }
  },
  
  generateInvoiceNumber: async (userId) => {
    const invoiceNumber = generateInvoiceNumber('INV', userId);
    return invoiceNumber;
  }
}));