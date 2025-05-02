/*
  # Add Payment Tracking to Invoices

  1. New Columns
     - `payment_date` - Date when payment was received
     - `payment_method` - Method used for payment (bank transfer, cash, etc.)
     - `payment_reference` - Reference number or transaction ID
     - `partially_paid_amount` - Amount received for partial payments

  2. Changes
     - Enhance the invoices table to track detailed payment information
     - Allow for recording actual payment date and method
     - Support partial payments tracking
*/

-- Add payment tracking fields to invoices table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE invoices ADD COLUMN payment_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE invoices ADD COLUMN payment_method text CHECK (
      payment_method IS NULL OR 
      payment_method IN ('bank_transfer', 'cash', 'cheque', 'upi', 'other')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE invoices ADD COLUMN payment_reference text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'partially_paid_amount'
  ) THEN
    ALTER TABLE invoices ADD COLUMN partially_paid_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'is_partially_paid'
  ) THEN
    ALTER TABLE invoices ADD COLUMN is_partially_paid boolean DEFAULT false;
  END IF;
END $$;

-- Add 'partially_paid' option to status check constraint
DO $$ 
BEGIN
  ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
  
  ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'partially_paid'));
END $$;

-- Add index on status for faster queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'invoices' AND indexname = 'invoices_status_idx'
  ) THEN
    CREATE INDEX invoices_status_idx ON invoices (status);
  END IF;
END $$;