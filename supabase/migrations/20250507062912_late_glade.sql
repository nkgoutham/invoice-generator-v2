/*
  # Expense Tracking Module

  1. New Tables
    - `expense_categories`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to users)
      - `name` (text)
      - `description` (text)
      - `color` (text)
    - `expenses`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to users)
      - `date` (date)
      - `amount` (numeric)
      - `description` (text)
      - `category_id` (uuid, foreign key to expense_categories)
      - `client_id` (uuid, foreign key to clients, nullable)
      - `invoice_id` (uuid, foreign key to invoices, nullable)
      - `is_recurring` (boolean)
      - `recurring_frequency` (text, enum)
      - `receipt_url` (text)
      - `notes` (text)
      - `is_billable` (boolean)
      - `is_reimbursable` (boolean)
      - `reimbursed` (boolean)
      - `payment_method` (text)
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6'
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
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
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('cash', 'credit_card', 'bank_transfer', 'upi', 'other'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS expense_categories_user_id_idx ON expense_categories(user_id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);
CREATE INDEX IF NOT EXISTS expenses_category_id_idx ON expenses(category_id);
CREATE INDEX IF NOT EXISTS expenses_client_id_idx ON expenses(client_id);
CREATE INDEX IF NOT EXISTS expenses_invoice_id_idx ON expenses(invoice_id);

-- Enable Row Level Security
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expense_categories
CREATE POLICY "Users can insert their own expense categories"
  ON expense_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories"
  ON expense_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own expense categories"
  ON expense_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense categories"
  ON expense_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for expenses
CREATE POLICY "Users can insert their own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create default expense categories for new users
CREATE OR REPLACE FUNCTION create_default_expense_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO expense_categories (user_id, name, color)
  VALUES 
    (NEW.id, 'Software & Subscriptions', '#3B82F6'),
    (NEW.id, 'Travel', '#F59E0B'),
    (NEW.id, 'Office Supplies', '#10B981'),
    (NEW.id, 'Marketing', '#EC4899'),
    (NEW.id, 'Utilities', '#6366F1'),
    (NEW.id, 'Professional Services', '#8B5CF6'),
    (NEW.id, 'Equipment', '#EF4444'),
    (NEW.id, 'Meals & Entertainment', '#F97316'),
    (NEW.id, 'Miscellaneous', '#6B7280');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add default expense categories for new users
DROP TRIGGER IF EXISTS create_default_expense_categories_trigger ON auth.users;
CREATE TRIGGER create_default_expense_categories_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_expense_categories();