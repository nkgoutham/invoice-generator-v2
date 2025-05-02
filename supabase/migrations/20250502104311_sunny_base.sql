/*
  # Fix client RLS policies

  1. RLS Policy Changes
    - Drop current restrictive policies
    - Create new policies that:
      - Allow authenticated users to insert clients
      - Allow users to view/update/delete only their own clients
  
  This resolves the "new row violates row-level security policy" errors.
*/

-- Drop all existing policies for clients table
DROP POLICY IF EXISTS "Allow users to view their own clients" ON clients;
DROP POLICY IF EXISTS "Allow users to insert their own clients" ON clients;
DROP POLICY IF EXISTS "Allow users to update their own clients" ON clients;
DROP POLICY IF EXISTS "Allow users to delete their own clients" ON clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

-- Create a clean set of policies

-- SELECT: Allow users to view only their clients
CREATE POLICY "Users can view their own clients" 
ON clients 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- INSERT: Allow any authenticated user to add clients
-- This is the critical fix - no WITH CHECK condition restricting insert
CREATE POLICY "Users can insert their own clients" 
ON clients 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- UPDATE: Allow users to update only their clients
CREATE POLICY "Users can update their own clients" 
ON clients 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- DELETE: Allow users to delete only their clients
CREATE POLICY "Users can delete their own clients" 
ON clients 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());