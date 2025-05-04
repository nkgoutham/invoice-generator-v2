/*
  # Fix milestone data for specific invoice

  1. Purpose
     - Add missing milestone data for invoice eb630275-58f3-45ff-bfd3-c349e27f0728
     - Insert the correct milestone items with proper names and amounts

  2. Changes
     - Deletes any existing invoice items for this invoice to avoid duplicates
     - Inserts 5 milestone records with the correct data
     - Creates index on milestone_name for better query performance
     - Adds proper constraint for invoice items
*/

-- First, delete any existing invoice items for this invoice to avoid duplicates
DELETE FROM invoice_items WHERE invoice_id = 'eb630275-58f3-45ff-bfd3-c349e27f0728';

-- Insert milestone items for this specific invoice
INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount, milestone_name) VALUES
('eb630275-58f3-45ff-bfd3-c349e27f0728', NULL, 1, 26100, 26100, 'Backend and Database Setup'),
('eb630275-58f3-45ff-bfd3-c349e27f0728', NULL, 1, 20880, 20880, 'Authentication and User Management'),
('eb630275-58f3-45ff-bfd3-c349e27f0728', NULL, 1, 26100, 26100, 'Core Navigation and Home Screen'),
('eb630275-58f3-45ff-bfd3-c349e27f0728', NULL, 1, 31320, 31320, 'Shop Visit Functionality'),
('eb630275-58f3-45ff-bfd3-c349e27f0728', NULL, 1, 31320, 31320, 'Order Placement and History');

-- Create an index on milestone_name for better performance
CREATE INDEX IF NOT EXISTS invoice_items_milestone_name_idx 
ON public.invoice_items USING btree (milestone_name) 
WHERE (milestone_name IS NOT NULL);

-- Add a constraint to ensure either description or milestone_name is populated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoice_items_description_or_milestone_check'
  ) THEN
    ALTER TABLE invoice_items
    ADD CONSTRAINT invoice_items_description_or_milestone_check
    CHECK ((description IS NOT NULL) OR (milestone_name IS NOT NULL));
  END IF;
END $$;