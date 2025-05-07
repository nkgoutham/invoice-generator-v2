/*
  # Add Default Expense Categories
  
  1. New Features
    - Create a trigger function to add default expense categories for new users
    - Add default categories for common expense types
    - Ensure existing users get default categories if they don't have any
  
  2. Security
    - Maintain existing RLS policies
*/

-- Create or replace the function to add default expense categories
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

-- Add default categories for existing users who don't have any
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users WHERE id NOT IN (
      SELECT DISTINCT user_id FROM public.expense_categories
    )
  LOOP
    INSERT INTO public.expense_categories (user_id, name, color, description)
    VALUES
      (user_record.id, 'Software Subscriptions', '#3B82F6', 'Monthly or annual software subscriptions'),
      (user_record.id, 'Hardware', '#8B5CF6', 'Computer equipment, peripherals, and other hardware'),
      (user_record.id, 'Office Supplies', '#10B981', 'Paper, pens, and other office materials'),
      (user_record.id, 'Travel', '#F59E0B', 'Transportation, accommodation, and travel expenses'),
      (user_record.id, 'Meals', '#EF4444', 'Business meals and entertaining clients'),
      (user_record.id, 'Professional Services', '#EC4899', 'Accounting, legal, and consulting services'),
      (user_record.id, 'Marketing', '#F97316', 'Advertising, promotions, and marketing expenses'),
      (user_record.id, 'Utilities', '#6366F1', 'Internet, phone, electricity bills'),
      (user_record.id, 'Rent', '#64748B', 'Office or workspace rental'),
      (user_record.id, 'Education', '#14B8A6', 'Courses, books, and professional development');
  END LOOP;
END;
$$;