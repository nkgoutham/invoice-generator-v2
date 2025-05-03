/*
  # Enhanced invoice items storage

  1. New Fields
    - `milestone_name` - For milestone-based invoices to store milestone names
    - `retainer_period` - For retainership-based invoices to store billing period
    - `project_description` - For project-based invoices to store project description details
  
  2. Changes
    - Modified description to be nullable (required for milestone-based invoices)
    - Added appropriate indexes for improved query performance
    - Updated constraints to allow for different engagement-type data structures
*/

-- Add columns for different engagement types to the invoice_items table
ALTER TABLE invoice_items 
  ADD COLUMN IF NOT EXISTS milestone_name TEXT,
  ADD COLUMN IF NOT EXISTS retainer_period TEXT,
  ADD COLUMN IF NOT EXISTS project_description TEXT,
  ALTER COLUMN description DROP NOT NULL;

-- Add indexes on the new columns
CREATE INDEX IF NOT EXISTS invoice_items_milestone_name_idx ON invoice_items (milestone_name) WHERE milestone_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS invoice_items_engagement_type_idx ON invoice_items (invoice_id) INCLUDE (milestone_name);

-- Add a constraint to ensure at least one of description or milestone_name is not null
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoice_items_description_or_milestone_check'
  ) THEN
    EXECUTE '
      ALTER TABLE invoice_items 
      ADD CONSTRAINT invoice_items_description_or_milestone_check 
      CHECK (description IS NOT NULL OR milestone_name IS NOT NULL)
    ';
  END IF;
END $$;