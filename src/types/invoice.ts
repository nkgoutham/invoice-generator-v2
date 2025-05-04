export interface InvoiceFormData {
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  notes: string;
  currency: string;
  engagement_type: string;
  tax_percentage: number;
  reverse_calculation: boolean;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  milestones?: Array<{
    name: string;
    amount: number;
  }>;
  retainer_period?: string;
  project_description?: string;
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  status?: string;
}

export interface InvoicePreviewData {
  issuer: {
    business_name: string;
    address: string;
    pan_number?: string;
    phone?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    footer_text?: string;
  };
  client: {
    name: string;
    company_name?: string;
    billing_address?: string;
    email?: string;
    phone?: string;
    gst_number?: string;
  };
  banking?: {
    account_holder?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
    branch?: string;
  };
  invoice: {
    invoice_number: string;
    issue_date: string;
    due_date: string;
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
    currency: string;
    tax_percentage: number;
    engagement_type?: string;
    items?: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    milestones?: Array<{
      name: string;
      amount: number;
    }>;
    payment_date?: string;
    payment_method?: string;
    payment_reference?: string;
    is_partially_paid?: boolean;
    partially_paid_amount?: number;
    status?: string;
  };
}

export interface PaymentDetails {
  payment_date: string;
  payment_method: string;
  payment_reference: string;
  amount: number;
  is_partially_paid: boolean;
  status?: string;
}

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'other', label: 'Other' }
];

export interface RecurringInvoiceFormData extends Omit<InvoiceFormData, 'invoice_number'> {
  title: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  auto_send: boolean;
}

export const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

export interface InvoiceReminderFormData {
  days_before_due: number[];
  days_after_due: number[];
  reminder_subject: string;
  reminder_message: string;
  enabled: boolean;
}