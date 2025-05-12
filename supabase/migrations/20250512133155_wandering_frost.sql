/*
  # Add GST and TDS Fields to Invoices Schema

  1. New Columns Added
    - `is_gst_registered` (boolean): Flag indicating if invoice issuer is GST registered
    - `gstin` (text): GST Identification Number
    - `gst_rate` (numeric): GST rate percentage to be applied (default 18%)
    - `is_tds_applicable` (boolean): Flag indicating if TDS deduction is applicable
    - `tds_rate` (numeric): TDS rate percentage to be applied (default 10%)
    
  2. Comments
    - Added descriptive comments for each field
*/

-- Add GST and TDS fields to the invoices table if they don't exist
DO $$
BEGIN
  -- GST fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'is_gst_registered'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN is_gst_registered boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'gstin'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN gstin text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'gst_rate'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN gst_rate numeric DEFAULT 18;
  END IF;
  
  -- TDS fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'is_tds_applicable'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN is_tds_applicable boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'tds_rate'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN tds_rate numeric DEFAULT 10;
  END IF;
  
  -- Add GSTIN field to profiles table for GST registered businesses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gstin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gstin text;
  END IF;
END $$;

-- Comment on columns
COMMENT ON COLUMN public.invoices.is_gst_registered IS 'Flag indicating if the invoice issuer is GST registered';
COMMENT ON COLUMN public.invoices.gstin IS 'GST Identification Number';
COMMENT ON COLUMN public.invoices.gst_rate IS 'GST rate percentage to be applied';
COMMENT ON COLUMN public.invoices.is_tds_applicable IS 'Flag indicating if TDS deduction is applicable';
COMMENT ON COLUMN public.invoices.tds_rate IS 'TDS rate percentage to be applied';