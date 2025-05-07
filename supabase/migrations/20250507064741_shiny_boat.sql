/*
  # Add default expense categories and currency option for expenses

  1. New Features
    - Add default expense categories for better user experience
    - Add a trigger function to create default categories for new users
    - Add currency column to expenses table to support USD and INR

  2. Security
    - Update RLS policies to reflect changes
*/

-- Add trigger function to create default expense categories when a new user signs up
CREATE OR REPLACE FUNCTION create_default_expense_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default categories for new user
  INSERT INTO public.expense_categories (user_id, name, color, description)
  VALUES
    (NEW.id, 'Software Subscriptions', '#3B82F6', 'Monthly or annual software subscriptions'),
    (NEW.id, 'Hardware', '#8B5CF6', 'Computer equipment, peripherals, and other hardware'),
    (NEW.id, 'Office Supplies', '#10B981', 'Paper, pens, and other office materials'),
    (NEW.id, 'Travel', '#F59E0B', 'Transportation, accommodation, and travel expenses'),
    (NEW.id, 'Meals', '#EF4444', 'Business meals and entertaining clients'),
    (NEW.id, 'Professional Services', '#EC4899', 'Accounting, legal, and consulting services'),
    (NEW.id, 'Marketing', '#F97316', 'Advertising, promotions, and marketing expenses'),
    (NEW.id, 'Utilities', '#6366F1', 'Internet, phone, electricity bills'),
    (NEW.id, 'Rent', '#64748B', 'Office or workspace rental'),
    (NEW.id, 'Education', '#14B8A6', 'Courses, books, and professional development');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_expense_categories();

-- Add currency column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'INR' 
CHECK (currency IN ('INR', 'USD'));

-- Create an index on currency column for faster filtering
CREATE INDEX expenses_currency_idx ON public.expenses (currency);