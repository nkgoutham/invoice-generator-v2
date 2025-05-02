/*
  # Add currency selector and improve milestone handling

  1. Changes
     - Add milestone_name field to invoice_items for better milestone tracking
     - Ensure currency field exists on invoices table with default 'INR'
     - Add engagement_type to invoices to allow overriding client's default
  
  2. Security
     - No security changes in this migration
*/

-- Make sure currency field exists on invoices table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'currency'
  ) THEN
    ALTER TABLE invoices ADD COLUMN currency text NOT NULL DEFAULT 'INR';
  END IF;
END $$;

-- Make sure engagement_type field exists on invoices table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'engagement_type'
  ) THEN
    ALTER TABLE invoices ADD COLUMN engagement_type text 
      CHECK (engagement_type IN ('retainership', 'project', 'milestone', 'service'));
  END IF;
END $$;

-- Add milestone_name field to invoice_items for better milestone tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'milestone_name'
  ) THEN
    ALTER TABLE invoice_items ADD COLUMN milestone_name text;
  END IF;
END $$;