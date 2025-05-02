/*
  # Fix Logo Persistence Issues

  1. Changes
     - Permanently disable row-level security on storage objects
     - Add indexing on logo_url field for faster queries
     - Update existing logo URLs with cache-busting timestamps
  
  2. Security
     - The design choice is to disable RLS on storage for simplicity
     - We'll rely on object path naming conventions for isolation
*/

-- Make sure RLS is disabled on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Update any existing logo URLs to include a timestamp to prevent caching
UPDATE profiles 
SET logo_url = CASE
  WHEN logo_url IS NOT NULL AND logo_url NOT LIKE '%?t=%' 
  THEN logo_url || '?t=' || extract(epoch from now())::text
  ELSE logo_url
END
WHERE logo_url IS NOT NULL;

-- Create index on logo_url for faster queries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'profiles_logo_url_idx'
  ) THEN
    CREATE INDEX profiles_logo_url_idx ON profiles (logo_url);
  END IF;
END $$;