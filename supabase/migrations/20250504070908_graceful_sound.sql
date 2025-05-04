/*
  # Revenue Tracking Tables

  1. New Tables
    - `revenue_entries`
      - Tracks all revenue entries from invoices
      - Automatically updated when invoices are paid
      - Stores both INR and USD amounts
      - Includes metadata like client, payment method, etc.

  2. Security
    - Enable RLS on revenue_entries table
    - Add policies for authenticated users to view their own entries

  3. Functions
    - Add trigger function to update revenue entries when invoices are paid
*/

-- Create revenue entries table
CREATE TABLE IF NOT EXISTS revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount_inr numeric DEFAULT 0,
  amount_usd numeric DEFAULT 0,
  payment_date date NOT NULL,
  payment_method text,
  payment_reference text,
  notes text
);

-- Enable RLS
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own revenue entries"
  ON revenue_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update revenue entries when invoice is paid
CREATE OR REPLACE FUNCTION update_revenue_entries()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create entry when invoice is marked as paid or partially paid
  IF (NEW.status = 'paid' OR NEW.status = 'partially_paid') AND 
     (OLD.status != 'paid' AND OLD.status != 'partially_paid') THEN
    
    INSERT INTO revenue_entries (
      user_id,
      invoice_id,
      client_id,
      amount_inr,
      amount_usd,
      payment_date,
      payment_method,
      payment_reference
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      NEW.client_id,
      CASE 
        WHEN NEW.currency = 'INR' THEN 
          COALESCE(NEW.partially_paid_amount, NEW.total)
        ELSE 0
      END,
      CASE 
        WHEN NEW.currency = 'USD' THEN 
          COALESCE(NEW.partially_paid_amount, NEW.total)
        ELSE 0
      END,
      COALESCE(NEW.payment_date, CURRENT_DATE),
      NEW.payment_method,
      NEW.payment_reference
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_revenue_entries_trigger ON invoices;
CREATE TRIGGER update_revenue_entries_trigger
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_revenue_entries();