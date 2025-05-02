import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type Profile = {
  id: string;
  created_at: string;
  user_id: string;
  business_name: string;
  address: string;
  pan_number: string;
  phone: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  footer_text: string;
};

export type BankingInfo = {
  id: string;
  created_at: string;
  user_id: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch: string;
};

export type Client = {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  company_name: string;
  billing_address: string;
  gst_number: string | null;
  contact_person: string;
  email: string;
  phone: string;
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
  service_rates: ServiceRate[] | null;
};

export type ServiceRate = {
  name: string;
  rate: number;
  unit: string;
};

export type Task = {
  id: string;
  created_at: string;
  client_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  engagement_model_id: string;
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
  notes: string;
  currency: 'INR' | 'USD';
  engagement_type?: 'retainership' | 'project' | 'milestone' | 'service';
  tax_percentage?: number;
  reverse_calculation?: boolean;
  payment_date?: string;
  payment_method?: 'bank_transfer' | 'cash' | 'cheque' | 'upi' | 'other';
  payment_reference?: string;
  is_partially_paid?: boolean;
  partially_paid_amount?: number;
  next_reminder_date?: string;
  last_reminder_sent?: string;
};

export type InvoiceItem = {
  id: string;
  created_at: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  task_id: string | null;
  milestone_name?: string;
};

export type Document = {
  id: string;
  created_at: string;
  client_id: string;
  name: string;
  file_url: string;
  type: 'contract' | 'scope' | 'other';
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
  template_data: RecurringInvoiceTemplate;
  auto_send: boolean;
};

export type RecurringInvoiceTemplate = {
  invoice_data: Partial<Invoice>;
  invoice_items: Partial<InvoiceItem>[];
};

export type InvoiceReminder = {
  id: string;
  created_at: string;
  user_id: string;
  days_before_due: number[];
  days_after_due: number[];
  reminder_subject: string;
  reminder_message: string;
  enabled: boolean;
};