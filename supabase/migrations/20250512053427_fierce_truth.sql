/*
  # Add tax_name column to invoices table

  1. New Column
    - `tax_name` (text): Stores the type of tax (e.g., GST, TDS, VAT)
    
  2. Changes
    - Adds a new column to the invoices table to store the tax name/type
*/

-- Add tax_name column to invoices table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'tax_name'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN tax_name text;
  END IF;
END $$;