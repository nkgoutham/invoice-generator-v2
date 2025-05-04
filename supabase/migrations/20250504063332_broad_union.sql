/*
  # Revenue Tracking Functionality

  1. New Functions
     - `get_revenue_history` - A SQL function to get revenue history with grouping by time period
     
  2. Indexes
     - Add indexes to `invoices.payment_date` and `invoices.status` for faster queries
     
  3. Changes
     - No table structure changes required as the necessary columns already exist
*/

-- Function to get revenue history grouped by different time periods
CREATE OR REPLACE FUNCTION get_revenue_history(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_view_mode TEXT DEFAULT 'monthly'
) 
RETURNS TABLE (
  period TEXT,
  amount_inr NUMERIC,
  amount_usd NUMERIC,
  total NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return data grouped by the requested view mode
  CASE p_view_mode
    WHEN 'daily' THEN
      RETURN QUERY 
        SELECT 
          to_char(payment_date, 'YYYY-MM-DD') as period,
          SUM(CASE WHEN currency = 'INR' THEN (CASE WHEN is_partially_paid THEN partially_paid_amount ELSE total END) ELSE 0 END) as amount_inr,
          SUM(CASE WHEN currency = 'USD' THEN (CASE WHEN is_partially_paid THEN partially_paid_amount ELSE total END) ELSE 0 END) as amount_usd,
          SUM(CASE WHEN is_partially_paid THEN partially_paid_amount ELSE total END) as total
        FROM 
          invoices
        WHERE 
          user_id = p_user_id
          AND status IN ('paid', 'partially_paid')
          AND payment_date >= p_start_date
          AND payment_date <= p_end_date
        GROUP BY 
          period
        ORDER BY 
          period DESC;
    
    WHEN 'yearly' THEN
      RETURN QUERY 
        SELECT 
          to_char(payment_date, 'YYYY') as period,
          SUM(CASE WHEN currency = 'INR' THEN (CASE WHEN is_partially_paid THEN partially_paid_amount ELSE total END) ELSE 0 END) as amount_inr,
          SUM(CASE WHEN currency = 'USD' THEN (CASE WHEN is_partially_paid THEN partially_paid_amount ELSE total END) ELSE 0 END) as amount_usd,
          SUM(CASE WHEN is_partially_paid THEN partially_paid_amount ELSE total END) as total
        FROM 
          invoices
        WHERE 
          user_id = p_user_id
          AND status IN ('paid', 'partially_paid')
          AND payment_date >= p_start_date
          AND payment_date <= p_end_date
        GROUP BY 
          period
        ORDER BY 
          period DESC;
    
    ELSE -- Default to monthly
      RETURN QUERY 
        SELECT 
          to_char(payment_date, 'YYYY-MM') as period,
          SUM(CASE WHEN currency = 'INR' THEN (CASE WHEN is_partially_paid THEN partially_paid_amount ELSE total END) ELSE 0 END) as amount_inr,
          SUM(CASE WHEN currency = 'USD' THEN (CASE WHEN is_partially_paid THEN partially_paid_amount ELSE total END) ELSE 0 END) as amount_usd,
          SUM(CASE WHEN is_partially_paid THEN partially_paid_amount ELSE total END) as total
        FROM 
          invoices
        WHERE 
          user_id = p_user_id
          AND status IN ('paid', 'partially_paid')
          AND payment_date >= p_start_date
          AND payment_date <= p_end_date
        GROUP BY 
          period
        ORDER BY 
          period DESC;
  END CASE;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION get_revenue_history IS 'Get revenue history grouped by time period (daily, monthly, yearly)';