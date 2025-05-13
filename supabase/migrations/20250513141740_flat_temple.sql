/*
  # Add employee salary tracking

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text, not null)
      - `email` (text)
      - `phone` (text)
      - `designation` (text)
      - `hourly_rate` (numeric)
      - `monthly_salary` (numeric)
      - `join_date` (date)
      - `status` (text, default 'active')
      - `notes` (text)
      - `currency_preference` (text, default 'INR')
  
  2. Changes to Existing Tables
    - Added to `expenses` table:
      - `employee_id` (uuid, references employees)
      - `is_salary` (boolean, default false)
      - `salary_type` (text, with check constraint)
      - `hours_worked` (numeric)
  
  3. Security
    - Enable RLS on `employees` table
    - Add policies for authenticated users to manage their own employees
*/

-- Create employees table if it doesn't exist
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  designation text,
  hourly_rate numeric,
  monthly_salary numeric,
  join_date date,
  status text DEFAULT 'active',
  notes text,
  currency_preference text DEFAULT 'INR'
);

-- Add comment to employees table
COMMENT ON TABLE employees IS 'Stores employee information for tracking salary expenses';

-- Add constraints to employees table (with checks to avoid errors if they already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_status_check' AND conrelid = 'employees'::regclass
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_status_check 
      CHECK (status = ANY (ARRAY['active', 'inactive']));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_currency_preference_check' AND conrelid = 'employees'::regclass
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_currency_preference_check 
      CHECK (currency_preference = ANY (ARRAY['INR', 'USD']));
  END IF;
END $$;

-- Create indexes for employees table
CREATE INDEX IF NOT EXISTS employees_user_id_idx ON employees(user_id);

-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for employees table (drop if they exist to avoid errors)
DROP POLICY IF EXISTS "Users can view their own employees" ON employees;
DROP POLICY IF EXISTS "Users can insert their own employees" ON employees;
DROP POLICY IF EXISTS "Users can update their own employees" ON employees;
DROP POLICY IF EXISTS "Users can delete their own employees" ON employees;

CREATE POLICY "Users can view their own employees" 
  ON employees FOR SELECT 
  TO public 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own employees" 
  ON employees FOR INSERT 
  TO public 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees" 
  ON employees FOR UPDATE 
  TO public 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees" 
  ON employees FOR DELETE 
  TO public 
  USING (auth.uid() = user_id);

-- Add new fields to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_salary boolean DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS salary_type text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS hours_worked numeric;

-- Add comments to new columns
COMMENT ON COLUMN expenses.employee_id IS 'References the employee who received the salary payment';
COMMENT ON COLUMN expenses.is_salary IS 'Flag indicating if this expense is a salary payment';
COMMENT ON COLUMN expenses.salary_type IS 'Type of salary payment (hourly, monthly, project-based)';
COMMENT ON COLUMN expenses.hours_worked IS 'Number of hours worked (for hourly salary payments)';

-- Add constraint for salary_type (with check to avoid errors if it already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'expenses_salary_type_check' AND conrelid = 'expenses'::regclass
  ) THEN
    ALTER TABLE expenses ADD CONSTRAINT expenses_salary_type_check 
      CHECK (salary_type IS NULL OR salary_type = ANY (ARRAY['hourly', 'monthly', 'project', 'other']));
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS expenses_employee_id_idx ON expenses(employee_id);
CREATE INDEX IF NOT EXISTS expenses_is_salary_idx ON expenses(is_salary);
CREATE INDEX IF NOT EXISTS expenses_project_id_idx ON expenses(project_id);