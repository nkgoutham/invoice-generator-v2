/*
  # Create Profile Trigger

  1. New Function
    - `create_profile_on_signup`: Creates a profile record when a user signs up
  
  2. Security
    - The function can only be executed by the trigger system
    
  3. Trigger
    - Creates a profile automatically when a new user is created
    - Ensures every user has an associated profile
*/

-- Function to create a profile and banking info when a user signs up
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

-- Create a trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile_on_signup();

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
END $$;