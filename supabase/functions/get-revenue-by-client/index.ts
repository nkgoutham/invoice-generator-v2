// Supabase Edge Function to get revenue data by client
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  
  try {
    // Get URL and search params
    const url = new URL(req.url);
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');
    const preferredCurrency = url.searchParams.get('preferred_currency') || 'INR';
    const conversionRate = parseFloat(url.searchParams.get('conversion_rate') || '85');

    // Validate inputs
    if (!startDate || !endDate) {
      throw new Error('Start and end dates are required');
    }

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid token or user not found');
    }

    // Get revenue by client data
    const { data: revenueByClient, error: revenueError } = await supabaseClient.rpc(
      'get_revenue_by_client',
      {
        p_user_id: user.id,
        p_start_date: new Date(startDate).toISOString(),
        p_end_date: new Date(endDate).toISOString(),
        p_preferred_currency: preferredCurrency,
        p_conversion_rate: conversionRate
      }
    );

    if (revenueError) {
      throw new Error(`Error fetching revenue by client: ${revenueError.message}`);
    }

    // Calculate percentages of total revenue by client
    const totalRevenue = revenueByClient.reduce((sum, client) => sum + (client.total || 0), 0);
    
    const clientsWithPercentage = revenueByClient.map(client => ({
      ...client,
      percentage: totalRevenue > 0 
        ? Math.round((client.total / totalRevenue) * 100 * 10) / 10 // Round to 1 decimal place
        : 0
    }));

    return new Response(
      JSON.stringify({ 
        data: clientsWithPercentage,
        total: totalRevenue 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error('Error in get-revenue-by-client function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred processing the request' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});