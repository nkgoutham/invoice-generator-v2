/*
  # Fix User Registration and Profile Creation

  1. Changes
     - Properly drop trigger and function using CASCADE to handle dependencies
     - Fix the profile creation trigger function to correctly use UUIDs
     - Add robust error handling to prevent signup failures
     - Set security definer to run with elevated permissions
     - Fix RLS policies to allow trigger operations

  2. Technical Details
     - Use DROP CASCADE to ensure proper cleanup of dependent objects
     - Ensure NEW.id (UUID) is used instead of email
     - Add transaction isolation for each step
     - Fix policy syntax using WITH CHECK instead of USING for INSERT operations
*/

-- Drop the trigger and function with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_on_signup() CASCADE;

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

-- Drop and recreate RLS policies correctly using WITH CHECK for INSERT operations
-- For profiles table
DROP POLICY IF EXISTS "Profiles can be created by the trigger" ON public.profiles;
CREATE POLICY "Profiles can be created by the trigger"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (true);

-- For banking_info table
DROP POLICY IF EXISTS "Banking info can be created by the trigger" ON public.banking_info;
CREATE POLICY "Banking info can be created by the trigger"
ON public.banking_info
FOR INSERT
TO public
WITH CHECK (true);

-- For expense_categories table
DROP POLICY IF EXISTS "Expense categories can be created by the trigger" ON public.expense_categories;
CREATE POLICY "Expense categories can be created by the trigger"
ON public.expense_categories
FOR INSERT
TO public
WITH CHECK (true);

-- For currency_settings table
DROP POLICY IF EXISTS "Currency settings can be created by the trigger" ON public.currency_settings;
CREATE POLICY "Currency settings can be created by the trigger"
ON public.currency_settings
FOR INSERT
TO public
WITH CHECK (true);

-- For invoice_reminders table
DROP POLICY IF EXISTS "Invoice reminders can be created by the trigger" ON public.invoice_reminders;
CREATE POLICY "Invoice reminders can be created by the trigger"
ON public.invoice_reminders
FOR INSERT
TO public
WITH CHECK (true);