// Monthly Revenue Edge Function
// Calculates revenue totals and history based on revenue_entries table

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface RevenueEntry {
  amount_inr: number;
  amount_usd: number;
  payment_date: string;
}

interface MonthlyRevenue {
  period: string;
  amount_inr: number;
  amount_usd: number;
  total: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');
    const preferredCurrency = url.searchParams.get('preferred_currency') || 'INR';
    const conversionRate = parseFloat(url.searchParams.get('conversion_rate') || '85');

    if (!startDate || !endDate) {
      throw new Error('Start and end dates are required');
    }

    // Fetch revenue entries for the period
    const { data: entries, error: entriesError } = await supabaseClient
      .from('revenue_entries')
      .select('amount_inr, amount_usd, payment_date')
      .eq('user_id', user.id)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: false });

    if (entriesError) {
      throw entriesError;
    }

    // Calculate monthly totals
    const monthlyTotals = new Map<string, MonthlyRevenue>();
    
    (entries as RevenueEntry[]).forEach(entry => {
      const date = new Date(entry.payment_date);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyTotals.has(period)) {
        monthlyTotals.set(period, {
          period,
          amount_inr: 0,
          amount_usd: 0,
          total: 0
        });
      }
      
      const totals = monthlyTotals.get(period)!;
      totals.amount_inr += entry.amount_inr || 0;
      totals.amount_usd += entry.amount_usd || 0;
    });

    // Calculate total revenue in preferred currency
    let totalInr = 0;
    let totalUsd = 0;
    let total = 0;

    monthlyTotals.forEach(month => {
      totalInr += month.amount_inr;
      totalUsd += month.amount_usd;
      
      // Calculate total in preferred currency
      if (preferredCurrency === 'USD') {
        month.total = month.amount_usd + (month.amount_inr / conversionRate);
      } else {
        month.total = month.amount_inr + (month.amount_usd * conversionRate);
      }
    });

    // Calculate overall total in preferred currency
    if (preferredCurrency === 'USD') {
      total = totalUsd + (totalInr / conversionRate);
    } else {
      total = totalInr + (totalUsd * conversionRate);
    }

    // Sort monthly history by period
    const history = Array.from(monthlyTotals.values())
      .sort((a, b) => b.period.localeCompare(a.period));

    return new Response(
      JSON.stringify({
        total,
        inr: totalInr,
        usd: totalUsd,
        history
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});