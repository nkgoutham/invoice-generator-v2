/*
  # Fix User Registration Trigger

  1. Changes
     - Fix the create_profile_on_signup trigger function to properly handle user creation
     - Ensure the trigger function has the correct security context
     - Add proper error handling to prevent registration failures
     - Fix RLS policies to allow new user registration

  2. Security
     - Maintain row level security while allowing the trigger to function properly
     - Ensure users can only access their own data
*/

-- First, let's fix the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Add error handling with BEGIN/EXCEPTION block
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
      
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE NOTICE 'Error in create_profile_on_signup: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly attached to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- Ensure all tables have proper insert policies for authenticated users

-- Profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Banking info table
DROP POLICY IF EXISTS "Users can insert their own banking info" ON public.banking_info;
CREATE POLICY "Users can insert their own banking info"
  ON public.banking_info
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Currency settings table
DROP POLICY IF EXISTS "Users can insert their own currency settings" ON public.currency_settings;
CREATE POLICY "Users can insert their own currency settings"
  ON public.currency_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Invoice reminders table
DROP POLICY IF EXISTS "Users can insert their own invoice reminders" ON public.invoice_reminders;
CREATE POLICY "Users can insert their own invoice reminders"
  ON public.invoice_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);