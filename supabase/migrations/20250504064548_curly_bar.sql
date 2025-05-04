/*
  # Add SQL functions for revenue calculations

  1. New Functions
    - `get_total_revenue`: Calculate total revenue for a user in a date range
    - `get_revenue_by_period`: Calculate revenue by time period (day/month/year)
    - `get_revenue_by_client`: Calculate revenue by client

  These functions will support currency conversion for accurate reporting.
*/

-- Create function to get total revenue in a date range
CREATE OR REPLACE FUNCTION get_total_revenue(
  start_date TEXT,
  end_date TEXT, 
  user_id_param UUID
)
RETURNS TABLE (
  inr NUMERIC,
  usd NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN i.currency = 'INR' THEN 
      CASE WHEN i.status = 'partially_paid' THEN i.partially_paid_amount ELSE i.total END 
    ELSE 0 END), 0) as inr,
    COALESCE(SUM(CASE WHEN i.currency = 'USD' THEN 
      CASE WHEN i.status = 'partially_paid' THEN i.partially_paid_amount ELSE i.total END 
    ELSE 0 END), 0) as usd
  FROM
    invoices i
  WHERE
    i.user_id = user_id_param
    AND (i.payment_date IS NOT NULL)
    AND (i.status = 'paid' OR i.status = 'partially_paid')
    AND i.payment_date >= (start_date::timestamp)
    AND i.payment_date <= (end_date::timestamp);
END;
$$;

-- Create function to get revenue by time period (day/month/year)
CREATE OR REPLACE FUNCTION get_revenue_by_period(
  start_date TEXT,
  end_date TEXT, 
  trunc_format TEXT,
  user_id_param UUID
)
RETURNS TABLE (
  period TEXT,
  amount_inr NUMERIC,
  amount_usd NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN trunc_format = 'day' THEN to_char(date_trunc('day', i.payment_date), 'YYYY-MM-DD')
      WHEN trunc_format = 'month' THEN to_char(date_trunc('month', i.payment_date), 'Mon YYYY')
      WHEN trunc_format = 'year' THEN to_char(date_trunc('year', i.payment_date), 'YYYY')
      ELSE to_char(date_trunc('month', i.payment_date), 'Mon YYYY')
    END as period,
    COALESCE(SUM(CASE WHEN i.currency = 'INR' THEN 
      CASE WHEN i.status = 'partially_paid' THEN i.partially_paid_amount ELSE i.total END 
    ELSE 0 END), 0) as amount_inr,
    COALESCE(SUM(CASE WHEN i.currency = 'USD' THEN 
      CASE WHEN i.status = 'partially_paid' THEN i.partially_paid_amount ELSE i.total END 
    ELSE 0 END), 0) as amount_usd
  FROM
    invoices i
  WHERE
    i.user_id = user_id_param
    AND (i.payment_date IS NOT NULL)
    AND (i.status = 'paid' OR i.status = 'partially_paid')
    AND i.payment_date >= (start_date::timestamp)
    AND i.payment_date <= (end_date::timestamp)
  GROUP BY
    period
  ORDER BY
    MIN(i.payment_date) DESC;
END;
$$;

-- Create function to get revenue by client
CREATE OR REPLACE FUNCTION get_revenue_by_client(
  start_date TEXT,
  end_date TEXT, 
  user_id_param UUID
)
RETURNS TABLE (
  client_id UUID,
  amount_inr NUMERIC,
  amount_usd NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.client_id,
    COALESCE(SUM(CASE WHEN i.currency = 'INR' THEN 
      CASE WHEN i.status = 'partially_paid' THEN i.partially_paid_amount ELSE i.total END 
    ELSE 0 END), 0) as amount_inr,
    COALESCE(SUM(CASE WHEN i.currency = 'USD' THEN 
      CASE WHEN i.status = 'partially_paid' THEN i.partially_paid_amount ELSE i.total END 
    ELSE 0 END), 0) as amount_usd
  FROM
    invoices i
  WHERE
    i.user_id = user_id_param
    AND (i.payment_date IS NOT NULL)
    AND (i.status = 'paid' OR i.status = 'partially_paid')
    AND i.payment_date >= (start_date::timestamp)
    AND i.payment_date <= (end_date::timestamp)
  GROUP BY
    i.client_id
  ORDER BY
    (COALESCE(SUM(CASE WHEN i.currency = 'INR' THEN 
      CASE WHEN i.status = 'partially_paid' THEN i.partially_paid_amount ELSE i.total END 
    ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN i.currency = 'USD' THEN 
      CASE WHEN i.status = 'partially_paid' THEN i.partially_paid_amount ELSE i.total END 
    ELSE 0 END), 0)) DESC;
END;
$$;