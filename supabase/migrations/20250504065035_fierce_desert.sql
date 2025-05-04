/*
  # Currency SQL Functions

  1. New SQL Functions
    - `convert_usd_to_inr`: Converts USD amount to INR using user-specific exchange rate
    - `convert_inr_to_usd`: Converts INR amount to USD using user-specific exchange rate
    - `calculate_revenue_total`: Calculates total revenue in user's preferred currency
*/

-- Function to convert USD amount to INR based on user settings
CREATE OR REPLACE FUNCTION public.convert_usd_to_inr(
  user_id uuid, 
  amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  conversion_rate numeric;
BEGIN
  -- Get conversion rate from user settings
  SELECT usd_to_inr_rate INTO conversion_rate
  FROM public.currency_settings
  WHERE currency_settings.user_id = convert_usd_to_inr.user_id;

  -- If no settings found, use default 85.0
  IF conversion_rate IS NULL THEN
    conversion_rate := 85.0;
  END IF;

  RETURN amount * conversion_rate;
END;
$$;

-- Function to convert INR amount to USD based on user settings
CREATE OR REPLACE FUNCTION public.convert_inr_to_usd(
  user_id uuid, 
  amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  conversion_rate numeric;
BEGIN
  -- Get conversion rate from user settings
  SELECT usd_to_inr_rate INTO conversion_rate
  FROM public.currency_settings
  WHERE currency_settings.user_id = convert_inr_to_usd.user_id;

  -- If no settings found, use default 85.0
  IF conversion_rate IS NULL THEN
    conversion_rate := 85.0;
  END IF;

  RETURN amount / conversion_rate;
END;
$$;

-- Function to calculate revenue total based on user's preferred currency
CREATE OR REPLACE FUNCTION public.calculate_revenue_total(
  user_id uuid,
  amount_inr numeric,
  amount_usd numeric
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  preferred_currency text;
  total numeric;
BEGIN
  -- Get preferred currency from user settings
  SELECT cs.preferred_currency INTO preferred_currency
  FROM public.currency_settings cs
  WHERE cs.user_id = calculate_revenue_total.user_id;

  -- If no settings found, use 'INR' as default
  IF preferred_currency IS NULL THEN
    preferred_currency := 'INR';
  END IF;

  -- Calculate total based on preferred currency
  IF preferred_currency = 'USD' THEN
    total := amount_usd + public.convert_inr_to_usd(user_id, amount_inr);
  ELSE
    total := amount_inr + public.convert_usd_to_inr(user_id, amount_usd);
  END IF;

  RETURN total;
END;
$$;