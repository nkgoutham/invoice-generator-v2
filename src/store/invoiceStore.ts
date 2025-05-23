import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Invoice, InvoiceItem } from '../lib/supabase';
import { generateInvoiceNumber } from '../utils/helpers';
import toast from 'react-hot-toast';
import { PaymentDetails } from '../types/invoice';

// Define the invoice history type
export interface InvoiceHistory {
  timestamp: string;
  action: 'created' | 'updated' | 'status_changed' | 'payment_recorded';
  details?: any;
}

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  invoiceItems: InvoiceItem[];
  invoiceHistory: InvoiceHistory[];
  loading: boolean;
  error: string | null;
  fetchInvoices: (userId: string) => Promise<void>;
  fetchInvoice: (id: string) => Promise<void>;
  fetchInvoiceItems: (invoiceId: string) => Promise<void>;
  fetchInvoiceHistory: (invoiceId: string) => Promise<void>;
  generateInvoiceNumber: (userId: string) => Promise<string>;
  createInvoice: (
    invoiceData: Partial<Invoice>,
    invoiceItems: Array<Partial<InvoiceItem>> | Array<{name: string, amount: number}>
  ) => Promise<Invoice | null>;
  updateInvoiceStatus: (id: string, status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partially_paid') => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  recordPayment: (id: string, paymentDetails: PaymentDetails) => Promise<Invoice | null>;
  updateInvoice: (id: string, invoiceData: Partial<Invoice>, invoiceItems?: any[]) => Promise<Invoice | null>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  selectedInvoice: null,
  invoiceItems: [],
  invoiceHistory: [],
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

  fetchInvoiceHistory: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      // In a real implementation, this would fetch from a history table
      // For now, we'll create some mock history based on the invoice
      const invoice = get().selectedInvoice;
      
      if (invoice) {
        const history: InvoiceHistory[] = [
          {
            timestamp: invoice.created_at || new Date().toISOString(),
            action: 'created',
            details: { status: 'draft' }
          }
        ];
        
        // Add status change events if not draft
        if (invoice.status !== 'draft') {
          history.push({
            timestamp: new Date(new Date(invoice.created_at || '').getTime() + 3600000).toISOString(), // 1 hour after creation
            action: 'status_changed',
            details: { status: 'sent' }
          });
        }
        
        // Add payment recorded event if paid or partially paid
        if (invoice.status === 'paid' || invoice.status === 'partially_paid') {
          history.push({
            timestamp: invoice.payment_date || new Date().toISOString(),
            action: 'payment_recorded',
            details: { 
              status: invoice.status,
              payment_method: invoice.payment_method,
              amount: invoice.status === 'partially_paid' ? invoice.partially_paid_amount : invoice.total
            }
          });
        }
        
        // Sort by timestamp, newest first
        history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        set({ invoiceHistory: history });
      }
    } catch (error: any) {
      console.error('Error fetching invoice history:', error);
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
      
      if (invoiceError) {
        throw new Error(`Error creating invoice: ${invoiceError.message}`);
      }
      
      if (invoice) {
        // Format items based on engagement type
        let formattedItems;
        
        if (invoiceData.engagement_type === 'milestone') {
          // For milestone-based invoices
          formattedItems = (invoiceItems as any[]).map(milestone => ({
            invoice_id: invoice.id,
            milestone_name: typeof milestone.name === 'string' ? milestone.name : milestone.milestone_name || 'Milestone',
            description: null, // Not required for milestones
            quantity: 1,
            rate: typeof milestone.amount === 'number' ? milestone.amount : parseFloat(milestone.amount) || 0,
            amount: typeof milestone.amount === 'number' ? milestone.amount : parseFloat(milestone.amount) || 0
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
        
        if (itemsError) {
          throw new Error(`Error creating invoice items: ${itemsError.message}`);
        }
        
        // Fetch the updated invoices list
        if (invoiceData.user_id) {
          await get().fetchInvoices(invoiceData.user_id);
        }
        
        return invoice;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      set({ error: 'Failed to create invoice. Please ensure all required fields are filled.' });
      toast.error('Failed to create invoice. Please try again.');
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateInvoice: async (id, invoiceData, invoiceItems) => {
    try {
      set({ loading: true, error: null });
      
      // First, update the invoice
      const { data: updatedInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .select()
        .single();
      
      if (invoiceError) {
        throw new Error(`Error updating invoice: ${invoiceError.message}`);
      }
      
      // If invoice items are provided, update them too
      if (invoiceItems && updatedInvoice) {
        // First, delete existing invoice items
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);
        
        if (deleteError) {
          throw new Error(`Error deleting existing invoice items: ${deleteError.message}`);
        }
        
        // Format items based on engagement type
        let formattedItems;
        
        if (invoiceData.engagement_type === 'milestone') {
          // For milestone-based invoices
          formattedItems = (invoiceItems as any[]).map(milestone => ({
            invoice_id: id,
            milestone_name: typeof milestone.name === 'string' ? milestone.name : milestone.milestone_name || 'Milestone',
            description: null, // Not required for milestones
            quantity: 1,
            rate: typeof milestone.amount === 'number' ? milestone.amount : parseFloat(milestone.amount) || 0,
            amount: typeof milestone.amount === 'number' ? milestone.amount : parseFloat(milestone.amount) || 0
          }));
        } else if (invoiceData.engagement_type === 'retainership' || invoiceData.engagement_type === 'project') {
          // For retainership or project-based invoices
          const item = invoiceItems[0] as any;
          formattedItems = [{
            invoice_id: id,
            description: item.description || (invoiceData.engagement_type === 'project' ? 'Project Fee' : 'Monthly Retainer Fee'),
            quantity: 1,
            rate: item.rate || 0,
            amount: item.amount || 0,
            retainer_period: invoiceData.engagement_type === 'retainership' ? (invoiceData as any).retainer_period || null : null,
            project_description: invoiceData.engagement_type === 'project' ? (invoiceData as any).project_description || null : null
          }];
        } else {
          // For service/hourly-based invoices or default case
          formattedItems = invoiceItems.map((item: any) => ({
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          }));
        }
        
        // Insert the new invoice items
        const { error: insertError } = await supabase
          .from('invoice_items')
          .insert(formattedItems);
        
        if (insertError) {
          throw new Error(`Error inserting new invoice items: ${insertError.message}`);
        }
      }
      
      // Update the invoices list
      if (updatedInvoice) {
        const updatedInvoices = get().invoices.map(invoice => 
          invoice.id === id ? updatedInvoice : invoice
        );
        set({ invoices: updatedInvoices, selectedInvoice: updatedInvoice });
        return updatedInvoice;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      set({ error: 'Failed to update invoice. Please ensure all required fields are filled.' });
      toast.error('Failed to update invoice. Please try again.');
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
      let updatedInvoice = { ...get().selectedInvoice, ...updateData } as Invoice;
      set({ selectedInvoice: updatedInvoice });
      
      // Update the invoices list too
      const updatedInvoices = get().invoices.map(invoice => 
        invoice.id === id ? { ...invoice, ...updateData } : invoice
      );
      set({ invoices: updatedInvoices });
      
      // Update the invoice history
      const history = [...get().invoiceHistory];
      history.unshift({
        timestamp: new Date().toISOString(),
        action: 'status_changed',
        details: { status }
      });
      set({ invoiceHistory: history });
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
      
      // Check if we have a valid ID
      if (!id) {
        throw new Error("Invoice not found");
      }
      
      // First, check if the invoice is already paid to prevent duplicate payments
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('id, status, total, currency, partially_paid_amount, is_partially_paid, user_id, client_id')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // If the invoice is already fully paid, prevent recording another payment
      if (currentInvoice.status === 'paid') {
        throw new Error('This invoice has already been paid');
      }
      
      // Determine if this is a full or partial payment
      const { 
        payment_date, 
        payment_method, 
        payment_reference, 
        amount, 
        is_partially_paid,
        exchange_rate,
        inr_amount_received
      } = paymentDetails;
      
      // Calculate the total payment amount
      let newTotalPaid = amount;
      
      // If this is an additional payment for a partially paid invoice
      if (currentInvoice.is_partially_paid && currentInvoice.partially_paid_amount) {
        newTotalPaid += currentInvoice.partially_paid_amount;
      }
      
      // Determine if the payment completes the invoice
      const isPaid = !is_partially_paid || newTotalPaid >= currentInvoice.total;
      
      // Prepare the update data
      const updateData: any = {
        payment_date,
        payment_method,
        payment_reference,
        status: isPaid ? 'paid' : 'partially_paid', 
        is_partially_paid: !isPaid,
      };
      
      // Only set partially_paid_amount if it's a partial payment
      if (!isPaid) {
        updateData.partially_paid_amount = newTotalPaid;
      } else {
        // If fully paid, clear the partial payment fields
        updateData.partially_paid_amount = null;
        updateData.is_partially_paid = false;
      }
      
      // Update the invoice with payment details
      const { data: updatedInvoice, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create a revenue entry for this payment
      let amountInr = null;
      let amountUsd = null;
      
      // Set amounts based on currency
      if (currentInvoice.currency === 'USD') {
        // For USD invoices, determine INR amount
        amountUsd = amount;
        
        // Use provided INR amount or calculate from exchange rate
        if (inr_amount_received) {
          amountInr = inr_amount_received;
        } else if (exchange_rate) {
          amountInr = amount * exchange_rate;
        }
      } else {
        // For INR invoices, just set the INR amount
        amountInr = amount;
      }
      
      // Create the revenue entry
      const { error: revenueError } = await supabase
        .from('revenue_entries')
        .insert([{
          user_id: currentInvoice.user_id,
          invoice_id: id,
          client_id: currentInvoice.client_id,
          amount_inr: amountInr,
          amount_usd: amountUsd,
          payment_date,
          payment_method,
          payment_reference
        }]);
      
      if (revenueError) {
        console.error('Error creating revenue entry:', revenueError);
        // Don't throw here, as the payment was already recorded successfully
      }
      
      // Update the local state if the invoice exists in our store
      const selectedInvoice = get().selectedInvoice;
      if (selectedInvoice && selectedInvoice.id === id) {
        const updatedSelectedInvoice = { ...selectedInvoice, ...updateData };
        set({ selectedInvoice: updatedSelectedInvoice });
      }
      
      // Update the invoices list if the invoice exists there
      const invoices = get().invoices;
      const invoiceIndex = invoices.findIndex(invoice => invoice.id === id);
      
      if (invoiceIndex >= 0) {
        const updatedInvoices = [...invoices];
        updatedInvoices[invoiceIndex] = { ...updatedInvoices[invoiceIndex], ...updateData };
        set({ invoices: updatedInvoices });
      }
      
      // Update the invoice history
      const history = [...get().invoiceHistory];
      history.unshift({
        timestamp: new Date().toISOString(),
        action: 'payment_recorded',
        details: { 
          payment_date: paymentDetails.payment_date,
          payment_method: paymentDetails.payment_method,
          amount: paymentDetails.amount,
          is_partially_paid: !isPaid,
          total_paid: newTotalPaid,
          exchange_rate: exchange_rate,
          inr_amount: inr_amount_received || (exchange_rate ? amount * exchange_rate : undefined)
        }
      });
      set({ invoiceHistory: history });
      
      return updatedInvoice;
    } catch (error: any) {
      console.error('Error recording payment:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));