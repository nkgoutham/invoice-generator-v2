import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or anon key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom types for our Supabase tables
export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  business_name: string | null;
  address: string | null;
  pan_number: string | null;
  phone: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  footer_text: string | null;
  created_at?: string;
}

export interface BankingInfo {
  id: string;
  user_id: string;
  account_holder: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  bank_name: string | null;
  branch: string | null;
  created_at?: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  billing_address?: string | null;
  gst_number?: string | null;
  status?: string;
  engagement_status?: string;
  created_at?: string;
}

export interface EngagementModel {
  id: string;
  client_id: string;
  type: 'retainership' | 'project' | 'milestone' | 'service';
  retainer_amount?: number | null;
  project_value?: number | null;
  service_rates?: Array<{
    name: string;
    rate: number;
    unit: string;
    currency?: string;
  }> | null;
  created_at?: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partially_paid';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  currency: string;
  engagement_type?: string;
  tax_percentage?: number;
  reverse_calculation?: boolean;
  payment_date?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  partially_paid_amount?: number;
  is_partially_paid?: boolean;
  next_reminder_date?: string | null;
  last_reminder_sent?: string | null;
  created_at?: string;
  clients?: Client; // Used for joins
  milestones?: Array<{ name: string; amount: number }>;
  items?: any[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description?: string | null;
  quantity: number;
  rate: number;
  amount: number;
  milestone_name?: string | null;
  retainer_period?: string | null;
  project_description?: string | null;
  task_id?: string | null;
  created_at?: string;
}

export interface RecurringInvoice {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  next_issue_date: string;
  last_generated?: string | null;
  status: 'active' | 'inactive';
  template_data: any;
  auto_send?: boolean;
  created_at?: string;
  clients?: Client; // Used for joins
}

export interface InvoiceReminder {
  id: string;
  user_id: string;
  days_before_due: number[];
  days_after_due: number[];
  reminder_subject: string;
  reminder_message: string;
  enabled: boolean;
  created_at?: string;
}

export interface Task {
  id: string;
  client_id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  engagement_model_id?: string | null;
  created_at?: string;
}

export interface Document {
  id: string;
  client_id: string;
  name: string;
  file_url: string;
  type?: 'contract' | 'scope' | 'other' | null;
  created_at?: string;
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  hourly_rate?: number | null;
  monthly_salary?: number | null;
  join_date?: string | null;
  status?: string;
  notes?: string | null;
  currency_preference?: string;
  created_at?: string;
}