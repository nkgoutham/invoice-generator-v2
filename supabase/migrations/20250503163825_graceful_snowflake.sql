/*
  # Add currency to service_rates in engagement_models

  1. Changes
     - Add support for currency in service_rates JSON structure
     - Ensure existing service_rates are properly migrated with default currency (INR)

  2. Technical Notes
     - Uses a DO block to update existing service rates without data loss
     - Sets default currency to INR for existing records
*/

-- Add currency to service rates in existing engagement_models
DO $$
DECLARE
  model_record RECORD;
BEGIN
  FOR model_record IN SELECT id, service_rates FROM engagement_models WHERE service_rates IS NOT NULL
  LOOP
    UPDATE engagement_models 
    SET service_rates = (
      SELECT jsonb_agg(
        jsonb_set(
          rate, 
          '{currency}', 
          '"INR"', 
          true
        )
      )
      FROM jsonb_array_elements(model_record.service_rates) AS rate
    )
    WHERE id = model_record.id;
  END LOOP;
END $$;

-- Add a comment to explain the service_rates structure
COMMENT ON COLUMN engagement_models.service_rates IS 'Service rates as JSON array with rate, name, unit, and currency properties';