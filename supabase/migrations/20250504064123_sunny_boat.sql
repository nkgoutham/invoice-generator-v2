/*
  # Add currency settings table

  1. New Tables
    - `currency_settings`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to users)
      - `preferred_currency` (text, default 'INR')
      - `usd_to_inr_rate` (numeric, default 85.0)
  
  2. Security
    - Enable RLS on `currency_settings` table
    - Add policies for authenticated users to manage their own settings
*/

-- Create currency settings table
CREATE TABLE IF NOT EXISTS currency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preferred_currency text NOT NULL DEFAULT 'INR',
  usd_to_inr_rate numeric NOT NULL DEFAULT 85.0,
  CONSTRAINT currency_settings_preferred_currency_check
    CHECK (preferred_currency IN ('INR', 'USD'))
);

-- Create unique index on user_id to ensure one settings record per user
CREATE UNIQUE INDEX currency_settings_user_id_idx ON currency_settings(user_id);

-- Enable Row Level Security
ALTER TABLE currency_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own currency settings" 
  ON currency_settings FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own currency settings" 
  ON currency_settings FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own currency settings" 
  ON currency_settings FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);