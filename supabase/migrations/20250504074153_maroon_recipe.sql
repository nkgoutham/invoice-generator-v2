/*
  # Add RLS policies for revenue_entries table

  1. Security Changes
     - Add INSERT policy to allow users to create their own revenue entries
     - Add UPDATE policy to allow users to update their own revenue entries
     - Add DELETE policy to allow users to delete their own revenue entries

  The table already has a SELECT policy, but is missing the other necessary policies
  for complete CRUD operations. This migration adds those missing policies.
*/

-- Add INSERT policy
CREATE POLICY "Users can insert their own revenue entries"
  ON public.revenue_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

-- Add UPDATE policy
CREATE POLICY "Users can update their own revenue entries"
  ON public.revenue_entries
  FOR UPDATE
  TO authenticated
  USING (uid() = user_id);

-- Add DELETE policy
CREATE POLICY "Users can delete their own revenue entries"
  ON public.revenue_entries
  FOR DELETE
  TO authenticated
  USING (uid() = user_id);