import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export type Profile = {
  id: string;
  created_at: string;
  user_id: string;
  business_name: string | null;
  address: string | null;
  pan_number: string | null;
  phone: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  footer_text: string | null;
};

export type BankingInfo = {
  id: string;
  created_at: string;
  user_id: string;
  account_holder: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  bank_name: string | null;
  branch: string | null;
};

export type Client = {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  company_name: string | null;
  billing_address: string | null;
  gst_number: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  engagement_status: string;
};

export type EngagementModel = {
  id: string;
  created_at: string;
  client_id: string;
  type: 'retainership' | 'project' | 'milestone' | 'service';
  retainer_amount: number | null;
  project_value: number | null;
  service_rates: Array<{
    name: string;
    rate: number;
    unit: string;
  }> | null;
};

export type Invoice = {
  id: string;
  created_at: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partially_paid';
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  currency: string;
  engagement_type: 'retainership' | 'project' | 'milestone' | 'service';
  tax_percentage: number;
  reverse_calculation: boolean;
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  partially_paid_amount: number | null;
  is_partially_paid: boolean | null;
  clients?: Client;
};

export type InvoiceItem = {
  id: string;
  created_at: string;
  invoice_id: string;
  description: string | null;
  quantity: number;
  rate: number;
  amount: number;
  task_id: string | null;
  milestone_name: string | null;
  retainer_period: string | null;
  project_description: string | null;
};

export type RecurringInvoice = {
  id: string;
  created_at: string;
  user_id: string;
  client_id: string;
  title: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string | null;
  next_issue_date: string;
  last_generated: string | null;
  status: 'active' | 'inactive';
  template_data: {
    invoice_data: {
      due_date_days: number;
      notes: string | null;
      currency: string;
      engagement_type: string;
      tax_percentage: number;
      reverse_calculation: boolean;
    };
    invoice_items: Array<{
      description: string | null;
      quantity: number;
      rate: number;
      amount: number;
      milestone_name?: string;
    }>;
  };
  auto_send: boolean;
  clients?: Client;
};

export type InvoiceReminder = {
  id: string;
  created_at: string;
  user_id: string;
  days_before_due: number[];
  days_after_due: number[];
  reminder_subject: string | null;
  reminder_message: string | null;
  enabled: boolean;
};