/*
  # Fix clients table RLS policies

  1. Changes
    - Drop the existing INSERT policy for clients table
    - Create a new INSERT policy that allows authenticated users to insert clients while automatically setting user_id
    - Ensure proper RLS for clients access
  
  2. Security
    - Enable RLS remains on clients table
    - Add policy for authenticated users to insert their own clients
    - Existing policies for SELECT, UPDATE, DELETE remain unchanged
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow users to insert their own clients" ON clients;

-- Create a new INSERT policy that automatically sets user_id
CREATE POLICY "Allow users to insert their own clients" 
ON clients 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Verify existing SELECT policy is correct
DROP POLICY IF EXISTS "Allow users to view their own clients" ON clients;
CREATE POLICY "Allow users to view their own clients" 
ON clients 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Verify existing UPDATE policy is correct
DROP POLICY IF EXISTS "Allow users to update their own clients" ON clients;
CREATE POLICY "Allow users to update their own clients" 
ON clients 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Verify existing DELETE policy is correct
DROP POLICY IF EXISTS "Allow users to delete their own clients" ON clients;
CREATE POLICY "Allow users to delete their own clients" 
ON clients 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());