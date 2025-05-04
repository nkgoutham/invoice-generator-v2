/*
  # Fix revenue entries RLS policies
  
  1. New Policies
    - Add INSERT policy for revenue_entries table
    - Add UPDATE policy for revenue_entries table
    - Add DELETE policy for revenue_entries table
  
  2. Security
    - Ensure users can only manage their own revenue entries
*/

-- Add INSERT policy
CREATE POLICY "Users can insert their own revenue entries"
  ON public.revenue_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy
CREATE POLICY "Users can update their own revenue entries"
  ON public.revenue_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add DELETE policy
CREATE POLICY "Users can delete their own revenue entries"
  ON public.revenue_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);