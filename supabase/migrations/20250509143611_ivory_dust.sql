-- Fix permissions for the create_profile_on_signup function
-- This migration fixes the "permission denied for table expense_categories" error

-- 1. Make the function SECURITY DEFINER to run with the privileges of the function owner
-- 2. Grant permissions to the tables the function needs to access
-- 3. Set the search_path to avoid potential security issues

-- First, update the function to ensure it's SECURITY DEFINER with proper search_path
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS trigger AS $$
BEGIN
  -- Create a profile
  INSERT INTO public.profiles (user_id, business_name)
  VALUES (new.id, 'Your Business');

  -- Create banking info
  INSERT INTO public.banking_info (user_id, account_holder)
  VALUES (new.id, 'Account Holder Name');

  -- Create currency settings
  INSERT INTO public.currency_settings (user_id, preferred_currency, usd_to_inr_rate)
  VALUES (new.id, 'INR', 85.0);

  -- Create invoice reminders
  INSERT INTO public.invoice_reminders (user_id, days_before_due, days_after_due)
  VALUES (new.id, ARRAY[7, 1], ARRAY[1, 3, 7]);

  -- Create default expense categories
  INSERT INTO public.expense_categories (user_id, name, color)
  VALUES 
    (new.id, 'Office Supplies', '#3B82F6'),
    (new.id, 'Software & Subscriptions', '#10B981'),
    (new.id, 'Travel', '#F59E0B'),
    (new.id, 'Meals & Entertainment', '#EF4444'),
    (new.id, 'Professional Services', '#8B5CF6'),
    (new.id, 'Marketing', '#EC4899'),
    (new.id, 'Utilities', '#F97316'),
    (new.id, 'Rent', '#14B8A6'),
    (new.id, 'Miscellaneous', '#6B7280');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions to supabase_auth_admin for all tables used in the trigger function
GRANT INSERT ON public.profiles TO supabase_auth_admin;
GRANT INSERT ON public.banking_info TO supabase_auth_admin;
GRANT INSERT ON public.currency_settings TO supabase_auth_admin;
GRANT INSERT ON public.invoice_reminders TO supabase_auth_admin;
GRANT INSERT ON public.expense_categories TO supabase_auth_admin;

-- Add permission policies for trigger-created data
DO $$ 
BEGIN
  -- Allow all users to read their own trigger-created data
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles can be created by the trigger'
  ) THEN
    CREATE POLICY "Profiles can be created by the trigger" 
      ON public.profiles FOR INSERT TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'banking_info' AND policyname = 'Banking info can be created by the trigger'
  ) THEN
    CREATE POLICY "Banking info can be created by the trigger" 
      ON public.banking_info FOR INSERT TO public
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'currency_settings' AND policyname = 'Currency settings can be created by the trigger'
  ) THEN
    CREATE POLICY "Currency settings can be created by the trigger" 
      ON public.currency_settings FOR INSERT TO public
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'invoice_reminders' AND policyname = 'Invoice reminders can be created by the trigger'
  ) THEN
    CREATE POLICY "Invoice reminders can be created by the trigger" 
      ON public.invoice_reminders FOR INSERT TO public
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'expense_categories' AND policyname = 'Expense categories can be created by the trigger'
  ) THEN
    CREATE POLICY "Expense categories can be created by the trigger" 
      ON public.expense_categories FOR INSERT TO public
      WITH CHECK (true);
  END IF;
END $$;