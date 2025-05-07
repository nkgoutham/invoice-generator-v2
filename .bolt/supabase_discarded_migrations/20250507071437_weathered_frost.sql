/*
  # Add expense tracking functionality
  
  1. New Tables
    - `expense_categories` - Stores expense categories with custom colors
    - `expenses` - Stores expense records with client associations and receipt uploads
      
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own expenses and categories
*/

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6'
);

CREATE INDEX IF NOT EXISTS expense_categories_user_id_idx ON public.expense_categories USING btree (user_id);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  receipt_url TEXT,
  notes TEXT,
  is_billable BOOLEAN DEFAULT false,
  is_reimbursable BOOLEAN DEFAULT false,
  reimbursed BOOLEAN DEFAULT false,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('cash', 'credit_card', 'bank_transfer', 'upi', 'other')),
  currency TEXT DEFAULT 'INR' NOT NULL CHECK (currency IN ('INR', 'USD'))
);

CREATE INDEX IF NOT EXISTS expenses_category_id_idx ON public.expenses USING btree (category_id);
CREATE INDEX IF NOT EXISTS expenses_client_id_idx ON public.expenses USING btree (client_id);
CREATE INDEX IF NOT EXISTS expenses_currency_idx ON public.expenses USING btree (currency);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON public.expenses USING btree (date);
CREATE INDEX IF NOT EXISTS expenses_invoice_id_idx ON public.expenses USING btree (invoice_id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses USING btree (user_id);

-- Enable RLS on expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_categories
CREATE POLICY "Users can select their own expense categories"
  ON public.expense_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense categories"
  ON public.expense_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories"
  ON public.expense_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense categories"
  ON public.expense_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Users can select their own expenses"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a function to automatically create default expense categories for new users
CREATE OR REPLACE FUNCTION create_default_expense_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.expense_categories (user_id, name, color, description)
  VALUES
    (NEW.id, 'Software & Subscriptions', '#3B82F6', 'Software tools, subscriptions, and digital services'),
    (NEW.id, 'Travel', '#F59E0B', 'Transportation, accommodation, and travel-related expenses'),
    (NEW.id, 'Office Supplies', '#10B981', 'Stationery, equipment, and office materials'),
    (NEW.id, 'Marketing', '#EC4899', 'Advertising, promotions, and marketing expenses'),
    (NEW.id, 'Professional Services', '#8B5CF6', 'Legal, accounting, and consulting services'),
    (NEW.id, 'Utilities', '#6B7280', 'Internet, phone, electricity, and other utilities'),
    (NEW.id, 'Meals & Entertainment', '#EF4444', 'Business meals, client entertainment'),
    (NEW.id, 'Education', '#14B8A6', 'Courses, books, and professional development'),
    (NEW.id, 'Hardware', '#F97316', 'Computers, devices, and physical equipment'),
    (NEW.id, 'Miscellaneous', '#6B7280', 'Other business expenses');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when a new user signs up
CREATE TRIGGER create_default_expense_categories_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_expense_categories();