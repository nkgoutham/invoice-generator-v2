/*
  # Initialize Freelancer Invoice System Database

  1. New Tables
     - `profiles` - User profile information 
     - `banking_info` - Banking details for invoice payments
     - `clients` - Client information
     - `engagement_models` - Client engagement models
     - `tasks` - Task/milestone tracking
     - `invoices` - Invoice information
     - `invoice_items` - Line items for invoices
     - `documents` - Client documents

  2. Security
     - Enable RLS on all tables
     - Add policies for authenticated users to access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  business_name text,
  address text,
  pan_number text,
  phone text,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#0EA5E9',
  footer_text text
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Create banking_info table
CREATE TABLE IF NOT EXISTS banking_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  account_holder text,
  account_number text,
  ifsc_code text,
  bank_name text,
  branch text
);

ALTER TABLE banking_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own banking info" 
  ON banking_info 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own banking info" 
  ON banking_info 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banking info" 
  ON banking_info 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  company_name text,
  billing_address text,
  gst_number text,
  contact_person text,
  email text,
  phone text,
  status text DEFAULT 'active',
  engagement_status text DEFAULT 'onboarding'
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients" 
  ON clients 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" 
  ON clients 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
  ON clients 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
  ON clients 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create engagement_models table
CREATE TABLE IF NOT EXISTS engagement_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('retainership', 'project', 'milestone', 'service')),
  retainer_amount numeric,
  project_value numeric,
  service_rates jsonb
);

ALTER TABLE engagement_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clients' engagement models" 
  ON engagement_models 
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = engagement_models.client_id 
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their clients' engagement models" 
  ON engagement_models 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = engagement_models.client_id 
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their clients' engagement models" 
  ON engagement_models 
  FOR UPDATE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = engagement_models.client_id 
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their clients' engagement models" 
  ON engagement_models 
  FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = engagement_models.client_id 
    AND clients.user_id = auth.uid()
  ));

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  engagement_model_id uuid REFERENCES engagement_models(id) ON DELETE SET NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clients' tasks" 
  ON tasks 
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = tasks.client_id 
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their clients' tasks" 
  ON tasks 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = tasks.client_id 
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their clients' tasks" 
  ON tasks 
  FOR UPDATE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = tasks.client_id 
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their clients' tasks" 
  ON tasks 
  FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = tasks.client_id 
    AND clients.user_id = auth.uid()
  ));

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  subtotal numeric NOT NULL,
  tax numeric DEFAULT 0,
  total numeric NOT NULL,
  notes text
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices" 
  ON invoices 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" 
  ON invoices 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
  ON invoices 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
  ON invoices 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL,
  amount numeric NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invoice items" 
  ON invoice_items 
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their invoice items" 
  ON invoice_items 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their invoice items" 
  ON invoice_items 
  FOR UPDATE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their invoice items" 
  ON invoice_items 
  FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  type text CHECK (type IN ('contract', 'scope', 'other'))
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clients' documents" 
  ON documents 
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = documents.client_id 
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their clients' documents" 
  ON documents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = documents.client_id 
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their clients' documents" 
  ON documents 
  FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = documents.client_id 
    AND clients.user_id = auth.uid()
  ));

-- Create functions
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, business_name)
  VALUES (new.id, 'My Business');
  
  INSERT INTO public.banking_info (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_profile_on_signup();

-- Set up storage
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Create policies for storage
CREATE POLICY "Anyone can view logos" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view documents" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update their own documents" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'documents' AND owner = auth.uid());

CREATE POLICY "Authenticated users can delete their own documents" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'documents' AND owner = auth.uid());