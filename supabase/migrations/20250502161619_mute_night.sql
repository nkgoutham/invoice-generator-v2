/*
  # Add Recurring Invoices and Reminders

  1. New Tables
    - `recurring_invoices` - stores templates for automatically generating invoices on a schedule
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `client_id` (uuid, foreign key to clients)
      - `title` (text, name of the recurring invoice)
      - `frequency` (text, how often the invoice should be generated - weekly, monthly, quarterly, yearly)
      - `start_date` (date, when to start generating invoices)
      - `end_date` (date, optional, when to stop generating invoices)
      - `next_issue_date` (date, when the next invoice should be generated)
      - `last_generated` (date, when the last invoice was generated)
      - `status` (text, active or inactive)
      - `template_data` (jsonb, template data for the invoice)
      - `auto_send` (boolean, whether to automatically send the invoice)
    
    - `invoice_reminders` - stores reminder settings for invoices
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `days_before_due` (integer array, days before due date to send reminder)
      - `days_after_due` (integer array, days after due date to send reminder)
      - `reminder_subject` (text, subject of the reminder email)
      - `reminder_message` (text, message of the reminder email)
      - `enabled` (boolean, whether reminders are enabled)
    
  2. Security
    - Enable RLS on `recurring_invoices` and `invoice_reminders` tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for efficient querying
*/

-- Create recurring_invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  next_issue_date date NOT NULL,
  last_generated date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  template_data jsonb NOT NULL,
  auto_send boolean DEFAULT false
);

-- Create invoice_reminders table
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days_before_due integer[] DEFAULT '{7, 1}', -- Default: remind 7 days and 1 day before due
  days_after_due integer[] DEFAULT '{1, 3, 7}', -- Default: remind 1, 3, and 7 days after due
  reminder_subject text DEFAULT 'Invoice Reminder: #{invoice_number}',
  reminder_message text DEFAULT 'This is a friendly reminder that invoice #{invoice_number} for {amount} is {status}. Please make payment at your earliest convenience.',
  enabled boolean DEFAULT true
);

-- Add indexes
CREATE INDEX IF NOT EXISTS recurring_invoices_user_id_idx ON recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS recurring_invoices_next_issue_date_idx ON recurring_invoices(next_issue_date);
CREATE INDEX IF NOT EXISTS recurring_invoices_status_idx ON recurring_invoices(status);
CREATE INDEX IF NOT EXISTS invoice_reminders_user_id_idx ON invoice_reminders(user_id);

-- Enable Row Level Security
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_invoices
CREATE POLICY "Users can view their own recurring invoices"
  ON recurring_invoices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring invoices"
  ON recurring_invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring invoices"
  ON recurring_invoices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring invoices"
  ON recurring_invoices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for invoice_reminders
CREATE POLICY "Users can view their own invoice reminders"
  ON invoice_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice reminders"
  ON invoice_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice reminders"
  ON invoice_reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice reminders"
  ON invoice_reminders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add next_reminder_date and last_reminder_sent to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS next_reminder_date date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminder_sent date;

-- Create a function to calculate the next issue date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_issue_date(start_date date, frequency text)
RETURNS date AS $$
BEGIN
  CASE 
    WHEN frequency = 'weekly' THEN
      RETURN start_date + INTERVAL '7 days';
    WHEN frequency = 'monthly' THEN
      RETURN start_date + INTERVAL '1 month';
    WHEN frequency = 'quarterly' THEN
      RETURN start_date + INTERVAL '3 months';
    WHEN frequency = 'yearly' THEN
      RETURN start_date + INTERVAL '1 year';
    ELSE
      RAISE EXCEPTION 'Invalid frequency: %', frequency;
  END CASE;
END;
$$ LANGUAGE plpgsql;