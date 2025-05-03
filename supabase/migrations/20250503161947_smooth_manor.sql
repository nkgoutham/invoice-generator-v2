/*
  # Update existing invoice milestone data

  1. Migration Purpose
    - Fixes a previous issue where milestone details weren't properly stored
    - Updates the milestone data for invoice INV-2025-05-535
    - Ensures existing invoices display milestone data correctly

  2. Operations
    - Updates relevant invoice_items rows with milestone_name field
    - Maintains existing amount values
    - Retroactively adds milestone information for better reporting
*/

-- Check if the invoice exists with the specified number
DO $$
DECLARE
  v_invoice_id uuid;
BEGIN
  -- Get the invoice ID for the specified invoice number
  SELECT id INTO v_invoice_id FROM invoices WHERE invoice_number = 'INV-2025-05-535';
  
  -- Only proceed if the invoice exists
  IF v_invoice_id IS NOT NULL THEN
    -- Update the first milestone
    UPDATE invoice_items
    SET milestone_name = 'Backend and Database Setup'
    WHERE invoice_id = v_invoice_id 
      AND amount = 26100
      AND milestone_name IS NULL
      LIMIT 1;
    
    -- Update the second milestone
    UPDATE invoice_items
    SET milestone_name = 'Authentication and User Management'
    WHERE invoice_id = v_invoice_id 
      AND amount = 20880
      AND milestone_name IS NULL
      LIMIT 1;
    
    -- Update the third milestone
    UPDATE invoice_items
    SET milestone_name = 'Core Navigation and Home Screen'
    WHERE invoice_id = v_invoice_id 
      AND amount = 26100
      AND milestone_name IS NULL
      LIMIT 1;
    
    -- Update the fourth milestone
    UPDATE invoice_items
    SET milestone_name = 'Shop Visit Functionality'
    WHERE invoice_id = v_invoice_id 
      AND amount = 31320
      AND milestone_name IS NULL
      LIMIT 1;
    
    -- Update the fifth milestone
    UPDATE invoice_items
    SET milestone_name = 'Order Placement and History'
    WHERE invoice_id = v_invoice_id 
      AND amount = 31320
      AND milestone_name IS NULL
      LIMIT 1;
  END IF;
END $$;