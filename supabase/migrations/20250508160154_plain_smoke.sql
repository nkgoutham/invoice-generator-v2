/*
  # Fix User Signup Error

  1. Changes
     - Ensures the profile creation trigger works correctly
     - Adds appropriate RLS policies for new user registration
     - Fixes any permission issues for new user creation

  2. Security
     - Maintains security while allowing new users to register
     - Ensures proper RLS policies for user data
*/

-- First, let's make sure the trigger function exists and works correctly
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (user_id, business_name)
  VALUES (NEW.id, 'My Business');
  
  -- Create default banking info
  INSERT INTO public.banking_info (user_id)
  VALUES (NEW.id);
  
  -- Create default currency settings
  INSERT INTO public.currency_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default invoice reminder settings
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly attached to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- Ensure RLS is enabled on all tables but with proper policies
-- Profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Make sure the RLS policies for profiles allow for creation by the trigger function
DROP POLICY IF EXISTS "Profiles can be created by the trigger" ON public.profiles;
CREATE POLICY "Profiles can be created by the trigger"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);  -- Allow the trigger to create profiles

-- Make sure users can view and update their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Banking info table
ALTER TABLE public.banking_info ENABLE ROW LEVEL SECURITY;

-- Make sure the RLS policies for banking_info allow for creation by the trigger function
DROP POLICY IF EXISTS "Banking info can be created by the trigger" ON public.banking_info;
CREATE POLICY "Banking info can be created by the trigger"
  ON public.banking_info
  FOR INSERT
  WITH CHECK (true);  -- Allow the trigger to create banking info

-- Make sure users can view and update their own banking info
DROP POLICY IF EXISTS "Users can view their own banking info" ON public.banking_info;
CREATE POLICY "Users can view their own banking info"
  ON public.banking_info
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own banking info" ON public.banking_info;
CREATE POLICY "Users can update their own banking info"
  ON public.banking_info
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Currency settings table
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

-- Make sure the RLS policies for currency_settings allow for creation by the trigger function
DROP POLICY IF EXISTS "Currency settings can be created by the trigger" ON public.currency_settings;
CREATE POLICY "Currency settings can be created by the trigger"
  ON public.currency_settings
  FOR INSERT
  WITH CHECK (true);  -- Allow the trigger to create currency settings

-- Make sure users can view and update their own currency settings
DROP POLICY IF EXISTS "Users can view their own currency settings" ON public.currency_settings;
CREATE POLICY "Users can view their own currency settings"
  ON public.currency_settings
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own currency settings" ON public.currency_settings;
CREATE POLICY "Users can update their own currency settings"
  ON public.currency_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Invoice reminders table
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Make sure the RLS policies for invoice_reminders allow for creation by the trigger function
DROP POLICY IF EXISTS "Invoice reminders can be created by the trigger" ON public.invoice_reminders;
CREATE POLICY "Invoice reminders can be created by the trigger"
  ON public.invoice_reminders
  FOR INSERT
  WITH CHECK (true);  -- Allow the trigger to create invoice reminders

-- Make sure users can view and update their own invoice reminders
DROP POLICY IF EXISTS "Users can view their own invoice reminders" ON public.invoice_reminders;
CREATE POLICY "Users can view their own invoice reminders"
  ON public.invoice_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own invoice reminders" ON public.invoice_reminders;
CREATE POLICY "Users can update their own invoice reminders"
  ON public.invoice_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Expense categories table
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Make sure the RLS policies for expense_categories allow for creation by the trigger function
DROP POLICY IF EXISTS "Expense categories can be created by the trigger" ON public.expense_categories;
CREATE POLICY "Expense categories can be created by the trigger"
  ON public.expense_categories
  FOR INSERT
  WITH CHECK (true);  -- Allow the trigger to create expense categories

-- Make sure users can view, update and delete their own expense categories
DROP POLICY IF EXISTS "Users can select their own expense categories" ON public.expense_categories;
CREATE POLICY "Users can select their own expense categories"
  ON public.expense_categories
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expense categories" ON public.expense_categories;
CREATE POLICY "Users can update their own expense categories"
  ON public.expense_categories
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expense categories" ON public.expense_categories;
CREATE POLICY "Users can delete their own expense categories"
  ON public.expense_categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Make sure users can insert their own expense categories
DROP POLICY IF EXISTS "Users can insert their own expense categories" ON public.expense_categories;
CREATE POLICY "Users can insert their own expense categories"
  ON public.expense_categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);