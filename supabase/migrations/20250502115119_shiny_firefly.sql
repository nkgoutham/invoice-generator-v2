/*
  # Add Tax Calculation Fields

  1. Changes
     - Add a tax_percentage field to invoices table to store the GST/tax rate
     - Add a reverse_calculation flag to track if tax was calculated in reverse mode
  
  2. Purpose
     - Allow storing tax percentage for each invoice
     - Support recording whether tax was calculated in reverse mode (where the invoice subtotal is the target amount after tax)
*/

-- Add tax_percentage field to invoices table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'tax_percentage'
  ) THEN
    ALTER TABLE invoices ADD COLUMN tax_percentage NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Add reverse_calculation flag field to invoices table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'reverse_calculation'
  ) THEN
    ALTER TABLE invoices ADD COLUMN reverse_calculation BOOLEAN DEFAULT false;
  END IF;
END $$;