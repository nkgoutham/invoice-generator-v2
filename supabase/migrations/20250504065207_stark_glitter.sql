/*
  # Fix currency settings table creation

  1. New Tables
    - Conditionally creates `currency_settings` table if it doesn't exist
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `user_id` (uuid, references auth.users)
      - `preferred_currency` (text, default 'INR')
      - `usd_to_inr_rate` (numeric, default 85.0)
      
  2. Security
    - Adds RLS policies only if they don't exist
    - Constraint to enforce valid currency values
*/

-- Create currency settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.currency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency text NOT NULL DEFAULT 'INR',
  usd_to_inr_rate numeric NOT NULL DEFAULT 85.0,
  UNIQUE(user_id)
);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

-- Check if policies exist before creating them
DO $$
BEGIN
  -- Check if select policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'currency_settings' 
    AND policyname = 'Users can view their own currency settings'
  ) THEN
    CREATE POLICY "Users can view their own currency settings"
      ON public.currency_settings
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  -- Check if insert policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'currency_settings' 
    AND policyname = 'Users can insert their own currency settings'
  ) THEN
    CREATE POLICY "Users can insert their own currency settings"
      ON public.currency_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Check if update policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'currency_settings' 
    AND policyname = 'Users can update their own currency settings'
  ) THEN
    CREATE POLICY "Users can update their own currency settings"
      ON public.currency_settings
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Add constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'currency_settings_preferred_currency_check'
  ) THEN
    ALTER TABLE public.currency_settings 
      ADD CONSTRAINT currency_settings_preferred_currency_check 
      CHECK (preferred_currency IN ('INR', 'USD'));
  END IF;
END
$$;

-- Create an index if it doesn't exist
CREATE INDEX IF NOT EXISTS currency_settings_user_id_idx ON public.currency_settings (user_id);