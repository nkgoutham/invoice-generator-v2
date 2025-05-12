/*
  # Add Partially Paid Fields to Invoices Table
  
  1. New Columns
    - `is_partially_paid` (boolean): Flag indicating if the invoice has been partially paid
    - `partially_paid_amount` (numeric): The amount that has been paid so far
    
  2. Changes
    - Adds support for tracking partial payments on invoices
    - Ensures the invoice status can be set to 'partially_paid'
    - Updates the status check constraint to include the new status
*/

-- Add partially paid fields to the invoices table
DO $$
BEGIN
  -- Add is_partially_paid column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'is_partially_paid'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN is_partially_paid boolean DEFAULT false;
  END IF;
  
  -- Add partially_paid_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'partially_paid_amount'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN partially_paid_amount numeric DEFAULT 0;
  END IF;
  
  -- Update the status check constraint to include 'partially_paid'
  -- First, drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoices_status_check' AND conrelid = 'public.invoices'::regclass
  ) THEN
    ALTER TABLE public.invoices DROP CONSTRAINT invoices_status_check;
  END IF;
  
  -- Create the updated constraint
  ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_status_check 
    CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'partially_paid'::text]));
END $$;

-- Add comments to the new columns
COMMENT ON COLUMN public.invoices.is_partially_paid IS 'Flag indicating if the invoice has been partially paid';
COMMENT ON COLUMN public.invoices.partially_paid_amount IS 'The amount that has been paid so far';