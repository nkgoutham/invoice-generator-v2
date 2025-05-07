# Database Schema Documentation

## Overview
This document provides a comprehensive overview of the database schema for the easyinvoice application. The database is designed to support freelancers in managing clients, invoices, payments, and expenses.

## Tables

### profiles
Stores user profile information including business details and branding preferences.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  address TEXT,
  pan_number TEXT,
  phone TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#0EA5E9',
  footer_text TEXT
);

CREATE INDEX profiles_logo_url_idx ON public.profiles USING btree (logo_url);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their own profile
- Users can update their own profile
- Users can view their own profile

### banking_info
Stores banking details used for invoice payment instructions.

```sql
CREATE TABLE public.banking_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_holder TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  bank_name TEXT,
  branch TEXT
);

ALTER TABLE banking_info ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their own banking info
- Users can update their own banking info
- Users can view their own banking info

### clients
Stores information about the freelancer's clients.

```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  billing_address TEXT,
  gst_number TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  engagement_status TEXT DEFAULT 'onboarding'
);

-- RLS is disabled for clients table to allow for more flexible access patterns
```

### engagement_models
Stores the engagement model details for each client.

```sql
CREATE TABLE public.engagement_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('retainership', 'project', 'milestone', 'service')),
  retainer_amount NUMERIC,
  project_value NUMERIC,
  service_rates JSONB -- Service rates as JSON array with rate, name, unit, and currency properties
);

ALTER TABLE engagement_models ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their clients' engagement models
- Users can update their clients' engagement models
- Users can view their clients' engagement models
- Users can delete their clients' engagement models

### tasks
Stores tasks or milestones associated with clients.

```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  engagement_model_id UUID REFERENCES engagement_models(id) ON DELETE SET NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their clients' tasks
- Users can update their clients' tasks
- Users can view their clients' tasks
- Users can delete their clients' tasks

### invoices
Stores invoice information.

```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'partially_paid')),
  subtotal NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  notes TEXT,
  currency TEXT DEFAULT 'INR' NOT NULL,
  engagement_type TEXT CHECK (engagement_type IN ('retainership', 'project', 'milestone', 'service')),
  tax_percentage NUMERIC DEFAULT 0,
  reverse_calculation BOOLEAN DEFAULT false,
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('bank_transfer', 'cash', 'cheque', 'upi', 'other')),
  payment_reference TEXT,
  partially_paid_amount NUMERIC DEFAULT 0,
  is_partially_paid BOOLEAN DEFAULT false,
  next_reminder_date DATE,
  last_reminder_sent DATE
);

CREATE INDEX invoices_payment_date_idx ON public.invoices USING btree (payment_date);
CREATE INDEX invoices_payment_status_idx ON public.invoices USING btree (status, payment_date);
CREATE INDEX invoices_status_idx ON public.invoices USING btree (status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their own invoices
- Users can update their own invoices
- Users can view their own invoices
- Users can delete their own invoices

### invoice_items
Stores line items for each invoice.

```sql
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT,
  quantity NUMERIC DEFAULT 1 NOT NULL,
  rate NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  milestone_name TEXT,
  retainer_period TEXT,
  project_description TEXT,
  CHECK (description IS NOT NULL OR milestone_name IS NOT NULL)
);

CREATE INDEX invoice_items_engagement_type_idx ON public.invoice_items USING btree (invoice_id) INCLUDE (milestone_name);
CREATE INDEX invoice_items_milestone_name_idx ON public.invoice_items USING btree (milestone_name) WHERE (milestone_name IS NOT NULL);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their invoice items
- Users can update their invoice items
- Users can view their invoice items
- Users can delete their invoice items

### documents
Stores documents associated with clients.

```sql
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  type TEXT CHECK (type IN ('contract', 'scope', 'other'))
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their clients' documents
- Users can view their clients' documents
- Users can delete their clients' documents

### currency_settings
Stores currency preferences and conversion rates.

```sql
CREATE TABLE public.currency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency TEXT DEFAULT 'INR' NOT NULL CHECK (preferred_currency IN ('INR', 'USD')),
  usd_to_inr_rate NUMERIC DEFAULT 85.0 NOT NULL
);

CREATE UNIQUE INDEX currency_settings_user_id_idx ON public.currency_settings USING btree (user_id);

ALTER TABLE currency_settings ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can create their own currency settings
- Users can update their own currency settings
- Users can view their own currency settings

### recurring_invoices
Stores recurring invoice templates and schedules.

```sql
CREATE TABLE public.recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_issue_date DATE NOT NULL,
  last_generated DATE,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
  template_data JSONB NOT NULL,
  auto_send BOOLEAN DEFAULT false
);

CREATE INDEX recurring_invoices_next_issue_date_idx ON public.recurring_invoices USING btree (next_issue_date);
CREATE INDEX recurring_invoices_status_idx ON public.recurring_invoices USING btree (status);
CREATE INDEX recurring_invoices_user_id_idx ON public.recurring_invoices USING btree (user_id);

ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their own recurring invoices
- Users can update their own recurring invoices
- Users can view their own recurring invoices
- Users can delete their own recurring invoices

### invoice_reminders
Stores reminder settings for invoice due dates.

```sql
CREATE TABLE public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days_before_due INTEGER[] DEFAULT '{7,1}',
  days_after_due INTEGER[] DEFAULT '{1,3,7}',
  reminder_subject TEXT DEFAULT 'Invoice Reminder: #{invoice_number}',
  reminder_message TEXT DEFAULT 'This is a friendly reminder that invoice #{invoice_number} for {amount} is {status}. Please make payment at your earliest convenience.',
  enabled BOOLEAN DEFAULT true
);

CREATE INDEX invoice_reminders_user_id_idx ON public.invoice_reminders USING btree (user_id);

ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their own invoice reminders
- Users can update their own invoice reminders
- Users can view their own invoice reminders
- Users can delete their own invoice reminders

### revenue_entries
Stores revenue tracking information.

```sql
CREATE TABLE public.revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount_inr NUMERIC DEFAULT 0,
  amount_usd NUMERIC DEFAULT 0,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT
);

ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their own revenue entries
- Users can update their own revenue entries
- Users can view their own revenue entries
- Users can delete their own revenue entries

### expense_categories
Stores categories for organizing expenses.

```sql
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6'
);

CREATE INDEX expense_categories_user_id_idx ON public.expense_categories(user_id);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their own expense categories
- Users can update their own expense categories
- Users can select their own expense categories
- Users can delete their own expense categories

### expenses
Stores expense transactions with detailed tracking information.

```sql
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  receipt_url TEXT,
  notes TEXT,
  is_billable BOOLEAN DEFAULT false,
  is_reimbursable BOOLEAN DEFAULT false,
  reimbursed BOOLEAN DEFAULT false,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('cash', 'credit_card', 'bank_transfer', 'upi', 'other')),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD'))
);

CREATE INDEX expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX expenses_date_idx ON public.expenses(date);
CREATE INDEX expenses_category_id_idx ON public.expenses(category_id);
CREATE INDEX expenses_client_id_idx ON public.expenses(client_id);
CREATE INDEX expenses_invoice_id_idx ON public.expenses(invoice_id);
CREATE INDEX expenses_currency_idx ON public.expenses(currency);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can insert their own expenses
- Users can update their own expenses
- Users can select their own expenses
- Users can delete their own expenses

## Database Triggers

### update_revenue_entries
Automatically updates revenue entries when an invoice is marked as paid or partially paid.

### create_profile_on_signup
Automatically creates a profile and banking info entry when a new user signs up.

### create_default_expense_categories

## Relationships

- **profiles** has a one-to-one relationship with **users**
- **banking_info** has a one-to-one relationship with **users**
- **clients** has a many-to-one relationship with **users**
- **engagement_models** has a one-to-one relationship with **clients**
- **tasks** has a many-to-one relationship with **clients**
- **invoices** has a many-to-one relationship with both **users** and **clients**
- **invoice_items** has a many-to-one relationship with **invoices**
- **documents** has a many-to-one relationship with **clients**
- **recurring_invoices** has a many-to-one relationship with both **users** and **clients**
- **invoice_reminders** has a one-to-one relationship with **users**
- **revenue_entries** has many-to-one relationships with **users**, **invoices**, and **clients**
- **expense_categories** has a many-to-one relationship with **users**
- **expenses** has many-to-one relationships with **users**, **expense_categories**, **clients**, and **invoices**
- **currency_settings** has a one-to-one relationship with **users**

## Indexes
The database uses various indexes to optimize query performance:

- Primary key indexes on all tables
- Foreign key indexes where appropriate
- Specialized indexes for frequently queried columns (e.g., status, payment_date)
- Composite indexes for complex queries (e.g., payment_status_idx)

For expenses, indexes are created on:
- User ID for filtering by user
- Date for time-based filtering
- Category ID for category filtering
- Client ID for client-specific expenses
- Invoice ID for invoice-related expenses
- Currency for currency-specific filtering

## Security
The database implements row-level security (RLS) on most tables to ensure that users can only access their own data. Each table has specific policies that define the conditions under which users can select, insert, update, or delete records.