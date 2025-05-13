/*
  # Add Employee Expense Type

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, not nullable)
      - `email` (text)
      - `phone` (text)
      - `designation` (text)
      - `hourly_rate` (numeric)
      - `monthly_salary` (numeric)
      - `join_date` (date)
      - `status` (text, enum: active, inactive)
      - `notes` (text)
      - `currency_preference` (text, enum: INR, USD)

  2. Changes
    - Add new fields to `expenses` table:
      - `employee_id` (uuid, foreign key to employees)
      - `is_salary` (boolean)
      - `salary_type` (text, enum: hourly, monthly, project, other)
      - `hours_worked` (numeric)

  3. Security
    - Enable RLS on `employees` table
    - Add policies for CRUD operations on `employees` table
*/

-- Create employees table
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

-- Add constraints to employees table
ALTER TABLE employees ADD CONSTRAINT employees_status_check 
  CHECK (status = ANY (ARRAY['active', 'inactive']));

ALTER TABLE employees ADD CONSTRAINT employees_currency_preference_check 
  CHECK (currency_preference = ANY (ARRAY['INR', 'USD']));

-- Create indexes for employees table
CREATE INDEX employees_user_id_idx ON employees(user_id);

-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for employees table
CREATE POLICY "Users can view their own employees" 
  ON employees FOR SELECT 
  TO public 
  USING (uid() = user_id);

CREATE POLICY "Users can insert their own employees" 
  ON employees FOR INSERT 
  TO public 
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can update their own employees" 
  ON employees FOR UPDATE 
  TO public 
  USING (uid() = user_id);

CREATE POLICY "Users can delete their own employees" 
  ON employees FOR DELETE 
  TO public 
  USING (uid() = user_id);

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

-- Add constraint for salary_type
ALTER TABLE expenses ADD CONSTRAINT expenses_salary_type_check 
  CHECK (salary_type IS NULL OR salary_type = ANY (ARRAY['hourly', 'monthly', 'project', 'other']));

-- Create indexes for new columns
CREATE INDEX expenses_employee_id_idx ON expenses(employee_id);
CREATE INDEX expenses_is_salary_idx ON expenses(is_salary);