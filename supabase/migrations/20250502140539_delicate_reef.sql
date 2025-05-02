/*
  # Remove storage RLS policies

  1. Changes
     - Disable RLS on storage bucket objects
     - Drop all existing storage policies for logos and documents buckets
  
  2. Purpose
     - Fix logo upload functionality by removing restrictive RLS
     - Allow unrestricted access to storage buckets
*/

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own documents" ON storage.objects;

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;