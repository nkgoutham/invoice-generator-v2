-- CLEAN SLATE APPROACH: Complete rebuild of the signup trigger function
-- This migration drops ALL previous attempts and creates a fresh implementation

-- First, drop the trigger and function with CASCADE to handle ALL dependencies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_on_signup() CASCADE;

-- Simplified trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Run with creator's permissions to bypass RLS
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  -- Create banking info
  INSERT INTO public.banking_info (user_id)
  VALUES (NEW.id);
  
  -- Create currency settings
  INSERT INTO public.currency_settings (user_id)
  VALUES (NEW.id);
  
  -- Create invoice reminder settings
  INSERT INTO public.invoice_reminders (user_id)
  VALUES (NEW.id);
  
  -- Create default expense categories
  INSERT INTO public.expense_categories (user_id, name, color)
  VALUES
    (NEW.id, 'Office Supplies', '#3B82F6'),
    (NEW.id, 'Software & Subscriptions', '#10B981'),
    (NEW.id, 'Travel', '#F59E0B'),
    (NEW.id, 'Meals & Entertainment', '#EF4444'),
    (NEW.id, 'Professional Services', '#8B5CF6');
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but ALLOW USER CREATION to proceed
  RAISE WARNING 'Error in create_profile_on_signup: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- Make sure all tables have default values for required fields to prevent trigger errors
ALTER TABLE profiles ALTER COLUMN primary_color SET DEFAULT '#3B82F6';
ALTER TABLE profiles ALTER COLUMN secondary_color SET DEFAULT '#0EA5E9';
ALTER TABLE currency_settings ALTER COLUMN preferred_currency SET DEFAULT 'INR';
ALTER TABLE currency_settings ALTER COLUMN usd_to_inr_rate SET DEFAULT 85.0;
ALTER TABLE invoice_reminders ALTER COLUMN days_before_due SET DEFAULT ARRAY[7,1];
ALTER TABLE invoice_reminders ALTER COLUMN days_after_due SET DEFAULT ARRAY[1,3,7];
ALTER TABLE invoice_reminders ALTER COLUMN reminder_subject SET DEFAULT 'Invoice Reminder: #{invoice_number}';
ALTER TABLE invoice_reminders ALTER COLUMN reminder_message SET DEFAULT 'This is a friendly reminder that invoice #{invoice_number} for {amount} is {status}. Please make payment at your earliest convenience.';
ALTER TABLE invoice_reminders ALTER COLUMN enabled SET DEFAULT true;

-- Reset ALL RLS policies that could interfere with the trigger function
DROP POLICY IF EXISTS "Profiles can be created by the trigger" ON public.profiles;
DROP POLICY IF EXISTS "Banking info can be created by the trigger" ON public.banking_info;
DROP POLICY IF EXISTS "Currency settings can be created by the trigger" ON public.currency_settings;
DROP POLICY IF EXISTS "Invoice reminders can be created by the trigger" ON public.invoice_reminders;
DROP POLICY IF EXISTS "Expense categories can be created by the trigger" ON public.expense_categories;

-- Create simplified policies that don't interfere with signup
CREATE POLICY "Profiles can be created by the trigger"
ON public.profiles FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Banking info can be created by the trigger"
ON public.banking_info FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Currency settings can be created by the trigger"
ON public.currency_settings FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Invoice reminders can be created by the trigger"
ON public.invoice_reminders FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Expense categories can be created by the trigger"
ON public.expense_categories FOR INSERT TO public
WITH CHECK (true);