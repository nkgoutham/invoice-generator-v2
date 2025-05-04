/*
  # Fix milestone data for specific invoice
  
  1. Changes
     - Inserts milestone data for invoice eb630275-58f3-45ff-bfd3-c349e27f0728
     - Creates a new index to improve milestone queries
     - Adds a constraint to ensure invoice items have either description or milestone_name

  2. Details
     - Adds 5 milestone records with correct names and amounts
     - Deletes any existing incorrect invoice item records for this invoice
     - Ensures invoice items always have either description or milestone_name populated
*/

-- Step 1: Delete any existing items for this invoice to avoid duplicates
DELETE FROM invoice_items 
WHERE invoice_id = 'eb630275-58f3-45ff-bfd3-c349e27f0728';

-- Step 2: Insert the milestone items with proper data
INSERT INTO invoice_items (invoice_id, quantity, rate, amount, milestone_name)
VALUES
  ('eb630275-58f3-45ff-bfd3-c349e27f0728', 1, 26100, 26100, 'Backend and Database Setup'),
  ('eb630275-58f3-45ff-bfd3-c349e27f0728', 1, 20880, 20880, 'Authentication and User Management'),
  ('eb630275-58f3-45ff-bfd3-c349e27f0728', 1, 26100, 26100, 'Core Navigation and Home Screen'),
  ('eb630275-58f3-45ff-bfd3-c349e27f0728', 1, 31320, 31320, 'Shop Visit Functionality'),
  ('eb630275-58f3-45ff-bfd3-c349e27f0728', 1, 31320, 31320, 'Order Placement and History');

-- Step 3: Create an index for milestone_name to improve query performance
CREATE INDEX IF NOT EXISTS invoice_items_milestone_name_idx 
ON public.invoice_items (milestone_name) 
WHERE milestone_name IS NOT NULL;

-- Step 4: Add a constraint to ensure invoice items have either description or milestone_name
-- Use ALTER TABLE ADD CONSTRAINT without IF NOT EXISTS (which is not supported in this context)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoice_items_description_or_milestone_check'
  ) THEN
    ALTER TABLE public.invoice_items
    ADD CONSTRAINT invoice_items_description_or_milestone_check
    CHECK ((description IS NOT NULL) OR (milestone_name IS NOT NULL));
  END IF;
END
$$;