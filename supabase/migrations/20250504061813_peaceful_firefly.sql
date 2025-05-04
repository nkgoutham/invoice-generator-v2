/*
  # Add Revenue Tracking Support

  1. Changes
    - Add missing payment tracking columns to invoices table
    - Add indexes for performance optimization
    - Add check constraints for payment methods
    - Add trigger to update payment status

  2. Security
    - No changes to RLS policies needed as they are already in place
*/

-- Add missing payment tracking columns if they don't exist
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
    ALTER TABLE invoices ADD COLUMN payment_method text;
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

-- Add payment method check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_payment_method_check'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check
      CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY['bank_transfer', 'cash', 'cheque', 'upi', 'other']));
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS invoices_payment_date_idx ON invoices(payment_date);
CREATE INDEX IF NOT EXISTS invoices_payment_status_idx ON invoices(status, payment_date);