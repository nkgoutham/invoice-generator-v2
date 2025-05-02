/*
  # Add currency selection support

  1. Changes
     - Add currency field to invoices table with default of 'INR'
     - Ensure existing records have the default currency set
     - Add engagement_type field to invoices table to allow overriding client settings
  
  2. Data Updates
     - Set all existing invoices to INR currency
*/

-- Add currency column to invoices table
ALTER TABLE invoices ADD COLUMN currency text NOT NULL DEFAULT 'INR';

-- Add engagement_type column to invoices to allow overriding
ALTER TABLE invoices ADD COLUMN engagement_type text 
  CHECK (engagement_type IN ('retainership', 'project', 'milestone', 'service'));