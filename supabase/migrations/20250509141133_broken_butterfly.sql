/*
  # Auth Triggers for User Onboarding

  1. New Function
    - `create_profile_on_signup`: Creates necessary user data when a new user registers
    
  2. Triggers
    - Creates a trigger that runs the function when a new auth user is created
    
  3. Default Data
    - Creates default profile with basic business name
    - Creates default banking info with placeholder data
    - Creates default currency settings
    - Creates default invoice reminder settings
    - Creates default expense categories
*/

-- Function to create a profile and related data when a user signs up
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger already exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    -- Create a trigger to call the function when a new user signs up
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.create_profile_on_signup();
  END IF;
END
$$;

-- Ensure RLS policies exist for profile and banking info
DO $$ 
BEGIN
  -- Profiles table policies
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" 
      ON public.profiles FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" 
      ON public.profiles FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" 
      ON public.profiles FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Banking info table policies
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'banking_info' AND policyname = 'Users can view their own banking info'
  ) THEN
    CREATE POLICY "Users can view their own banking info" 
      ON public.banking_info FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'banking_info' AND policyname = 'Users can update their own banking info'
  ) THEN
    CREATE POLICY "Users can update their own banking info" 
      ON public.banking_info FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'banking_info' AND policyname = 'Users can insert their own banking info'
  ) THEN
    CREATE POLICY "Users can insert their own banking info" 
      ON public.banking_info FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Ensure RLS is enabled on necessary tables
  ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.banking_info ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.currency_settings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.invoice_reminders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.expense_categories ENABLE ROW LEVEL SECURITY;
END $$;