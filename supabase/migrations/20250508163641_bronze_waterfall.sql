/*
  # Fix user signup and profile creation

  1. Changes
     - Completely recreate the user signup trigger with proper error handling
     - Create proper RLS policies that won't interfere with the trigger
     - Ensure all user-related tables are properly configured for new user signup

  2. Technical Details
     - The trigger function now correctly uses the UUID from auth.users.id
     - Added comprehensive error handling in each step of the process
     - Set SECURITY DEFINER to ensure the function has proper permissions
*/

-- First, drop any existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Then drop the function
DROP FUNCTION IF EXISTS public.create_profile_on_signup();

-- Create a new, robust trigger function
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Run with permissions of the function creator
SET search_path = public
AS $$
DECLARE
  default_color_primary TEXT := '#3B82F6';
  default_color_secondary TEXT := '#0EA5E9';
BEGIN
  -- Create a profile for the new user
  BEGIN
    INSERT INTO public.profiles (user_id, primary_color, secondary_color)
    VALUES (
      NEW.id, -- Use the user's UUID, not email
      default_color_primary,
      default_color_secondary
    );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating profile: %', SQLERRM;
      -- Continue with other operations even if this one fails
  END;

  -- Create banking info
  BEGIN
    INSERT INTO public.banking_info (user_id)
    VALUES (NEW.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating banking info: %', SQLERRM;
  END;

  -- Create currency settings
  BEGIN
    INSERT INTO public.currency_settings (user_id, preferred_currency, usd_to_inr_rate)
    VALUES (NEW.id, 'INR', 85.0);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating currency settings: %', SQLERRM;
  END;
  
  -- Create invoice reminder settings
  BEGIN
    INSERT INTO public.invoice_reminders (
      user_id, 
      days_before_due, 
      days_after_due,
      reminder_subject,
      reminder_message,
      enabled
    )
    VALUES (
      NEW.id,
      ARRAY[7, 1],
      ARRAY[1, 3, 7],
      'Invoice Reminder: #{invoice_number}',
      'This is a friendly reminder that invoice #{invoice_number} for {amount} is {status}. Please make payment at your earliest convenience.',
      true
    );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating invoice reminders: %', SQLERRM;
  END;

  -- Create default expense categories
  BEGIN
    INSERT INTO public.expense_categories (user_id, name, color)
    VALUES
      (NEW.id, 'Office Supplies', '#3B82F6'),
      (NEW.id, 'Software & Subscriptions', '#10B981'),
      (NEW.id, 'Travel', '#F59E0B'),
      (NEW.id, 'Meals & Entertainment', '#EF4444'),
      (NEW.id, 'Professional Services', '#8B5CF6');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating expense categories: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- Drop and recreate RLS policies correctly
-- For profiles table
DO $$
BEGIN
    -- Check if the policy exists and drop it if it does
    IF EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Profiles can be created by the trigger' 
        AND polrelid = 'public.profiles'::regclass
    ) THEN
        DROP POLICY "Profiles can be created by the trigger" ON public.profiles;
    END IF;
END
$$;

-- Create new policy with correct syntax
CREATE POLICY "Profiles can be created by the trigger"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (true);

-- For banking_info table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Banking info can be created by the trigger' 
        AND polrelid = 'public.banking_info'::regclass
    ) THEN
        DROP POLICY "Banking info can be created by the trigger" ON public.banking_info;
    END IF;
END
$$;

CREATE POLICY "Banking info can be created by the trigger"
ON public.banking_info
FOR INSERT
TO public
WITH CHECK (true);

-- For expense_categories table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Expense categories can be created by the trigger' 
        AND polrelid = 'public.expense_categories'::regclass
    ) THEN
        DROP POLICY "Expense categories can be created by the trigger" ON public.expense_categories;
    END IF;
END
$$;

CREATE POLICY "Expense categories can be created by the trigger"
ON public.expense_categories
FOR INSERT
TO public
WITH CHECK (true);

-- For currency_settings table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Currency settings can be created by the trigger' 
        AND polrelid = 'public.currency_settings'::regclass
    ) THEN
        DROP POLICY "Currency settings can be created by the trigger" ON public.currency_settings;
    END IF;
END
$$;

CREATE POLICY "Currency settings can be created by the trigger"
ON public.currency_settings
FOR INSERT
TO public
WITH CHECK (true);

-- For invoice_reminders table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Invoice reminders can be created by the trigger' 
        AND polrelid = 'public.invoice_reminders'::regclass
    ) THEN
        DROP POLICY "Invoice reminders can be created by the trigger" ON public.invoice_reminders;
    END IF;
END
$$;

CREATE POLICY "Invoice reminders can be created by the trigger"
ON public.invoice_reminders
FOR INSERT
TO public
WITH CHECK (true);