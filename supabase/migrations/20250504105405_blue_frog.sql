/*
  # Fix revenue_entries RLS policies

  1. Security
    - Add proper RLS policies for revenue_entries table
    - Fix function reference from uid() to auth.uid()
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