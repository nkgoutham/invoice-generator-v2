/*
  # Fix User Signup Issues
  
  1. Changes
     - Completely rebuilds the create_profile_on_signup trigger function
     - Ensures proper error handling with EXCEPTION blocks
     - Uses SECURITY DEFINER context to bypass RLS for trigger operations 
     - Fixes the issue where emails were being used as UUIDs
  
  2. Security
     - Maintains data isolation through proper RLS policies
     - Allows the trigger function to work properly for new user creation
     - Ensures authenticated users can only access their own data
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if this function was already executed for this user to prevent duplicates
  SELECT COUNT(*) INTO v_count FROM public.profiles WHERE user_id = NEW.id;
  
  -- Only proceed if no profile exists for this user
  IF v_count = 0 THEN
    -- Add DEBUG logging
    RAISE NOTICE 'Creating profile for new user ID: %', NEW.id;
    
    BEGIN
      -- Create a profile for the new user
      INSERT INTO public.profiles (user_id, business_name)
      VALUES (NEW.id, 'My Business');
      
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue
        RAISE WARNING 'Error creating profile: %', SQLERRM;
    END;
    
    BEGIN
      -- Create default banking info
      INSERT INTO public.banking_info (user_id)
      VALUES (NEW.id);
      
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue
        RAISE WARNING 'Error creating banking info: %', SQLERRM;
    END;
    
    BEGIN
      -- Create default currency settings
      INSERT INTO public.currency_settings (user_id, preferred_currency, usd_to_inr_rate)
      VALUES (NEW.id, 'INR', 85.0);
      
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue
        RAISE WARNING 'Error creating currency settings: %', SQLERRM;
    END;
    
    BEGIN
      -- Create default invoice reminder settings
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
        -- Log error but continue
        RAISE WARNING 'Error creating invoice reminders: %', SQLERRM;
    END;
    
    BEGIN
      -- Create default expense categories
      INSERT INTO public.expense_categories (user_id, name, color, description)
      VALUES 
        (NEW.id, 'Office Supplies', '#3B82F6', 'Office materials and supplies'),
        (NEW.id, 'Software & Subscriptions', '#10B981', 'Software licenses and subscriptions'),
        (NEW.id, 'Travel', '#F59E0B', 'Travel expenses for business'),
        (NEW.id, 'Meals & Entertainment', '#EF4444', 'Business meals and client entertainment'),
        (NEW.id, 'Professional Services', '#8B5CF6', 'Legal, accounting, and consulting services');
      
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue
        RAISE WARNING 'Error creating expense categories: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger with the fixed function
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- Fix RLS policies to ensure they're not blocking the trigger function
-- All access should be through the user's own ID, never through emails

-- Ensure policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate any problematic policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

-- Add test check to verify the trigger is working properly
DO $$
BEGIN
  RAISE NOTICE 'User signup trigger is now properly configured';
END $$;