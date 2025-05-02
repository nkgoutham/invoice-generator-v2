/*
  # Add cascading deletes for user references
  
  1. Changes
    - Modify foreign key constraints in profiles, banking_info, clients, and invoices tables
    - Add ON DELETE CASCADE to user_id foreign keys
    - This allows deletion of users from the auth.users table without constraint errors
  
  2. Benefits
    - Allows deleting spam users through the Supabase dashboard
    - Automatically removes all associated user data when a user is deleted
    - Prevents orphaned records in the database
*/

-- Modify profiles table foreign key
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
  ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Modify banking_info table foreign key
ALTER TABLE banking_info 
  DROP CONSTRAINT IF EXISTS banking_info_user_id_fkey,
  ADD CONSTRAINT banking_info_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Modify clients table foreign key
ALTER TABLE clients 
  DROP CONSTRAINT IF EXISTS clients_user_id_fkey,
  ADD CONSTRAINT clients_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Modify invoices table foreign key
ALTER TABLE invoices 
  DROP CONSTRAINT IF EXISTS invoices_user_id_fkey,
  ADD CONSTRAINT invoices_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;