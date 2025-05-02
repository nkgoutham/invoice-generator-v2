/*
  # Modify Clients Table RLS Policies

  1. Changes
     - Update RLS policies for the clients table to be more permissive
     - Fix issues with client creation and fetching
  
  2. Security
     - Modify existing policies to ensure they function correctly
     - Keep user data separation while fixing permission issues
*/

-- First, drop existing policies on the clients table
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

-- Create new, more permissive policies
CREATE POLICY "Allow users to view their own clients" 
  ON clients 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert their own clients" 
  ON clients 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own clients" 
  ON clients 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own clients" 
  ON clients 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());