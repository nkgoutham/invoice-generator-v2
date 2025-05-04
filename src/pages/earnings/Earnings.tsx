import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useClientStore } from '../../store/clientStore';
import { useCurrencyStore } from '../../store/currencyStore';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ArrowRight, Calendar, ChevronsUpDown, DollarSign, Filter, BarChart2, PieChart, TrendingUp, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const Earnings = () => {
  const { user } = useAuthStore();
  const { clients, fetchClients } = useClientStore();
  const { currencySettings, fetchCurrencySettings } = useCurrencyStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => {
    // Default to first day of current month
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    // Default to last day of current month
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0); // Last day of current month
    date.setHours(23, 59, 59, 999);
    return date;
  });
  
  const [revenueData, setRevenueData] = useState<any>({
    total: 0,
    inr: 0,
    usd: 0,
    byClient: []
  });
  
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'monthly' | 'daily' | 'yearly'>('monthly');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch clients and currency settings on component mount
  useEffect(() => {
    if (user) {
      const initialize = async () => {
        // Fetch clients and currency settings in parallel
        await Promise.all([
          fetchClients(user.id),
          fetchCurrencySettings(user.id)
        ]);
      };
      
      initialize();
    }
  }, [user, fetchClients, fetchCurrencySettings]);
  
  // Fetch revenue data when date range or view mode changes
  useEffect(() => {
    fetchRevenueData();
  }, [startDate, endDate, viewMode, currencySettings]);
  
  const fetchRevenueData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Convert dates to ISO strings for database query
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();
      
      // Get preferred currency
      const preferredCurrency = currencySettings?.preferred_currency || 'INR';
      const conversionRate = currencySettings?.usd_to_inr_rate || 85;
      
      // 1. Fetch all paid invoices for the period
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          client_id,
          currency,
          total,
          subtotal,
          status,
          payment_date,
          partially_paid_amount,
          clients(name, company_name)
        `)
        .eq('user_id', user.id)
        .in('status', ['paid', 'partially_paid'])
        .gte('payment_date', startIso.split('T')[0])
        .lte('payment_date', endIso.split('T')[0])
        .order('payment_date', { ascending: false });

      if (invoicesError) {
        throw new Error(`Error fetching invoices: ${invoicesError.message}`);
      }

      // Calculate monthly history
      const monthlyData = processMonthlyData(invoices, preferredCurrency, conversionRate);
      
      // Calculate revenue by client
      const clientData = processClientData(invoices, preferredCurrency, conversionRate);
      
      // Set revenue data state
      setRevenueHistory(monthlyData.history);
      setRevenueData({
        total: monthlyData.total,
        inr: monthlyData.inr,
        usd: monthlyData.usd,
        byClient: clientData
      });
      
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      
      let errorMessage = 'Failed to fetch revenue data';
      
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      toast.error(errorMessage);
      
      // Set default empty data on error
      setRevenueHistory([]);
      setRevenueData({
        total: 0,
        inr: 0,
        usd: 0,
        byClient: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process invoices into monthly data
  const processMonthlyData = (invoices: any[], preferredCurrency: string, conversionRate: number) => {
    // Create a map to hold monthly totals
    const monthMap = new Map<string, { inr: number, usd: number, total: number }>();
    
    // Overall totals
    let totalInr = 0;
    let totalUsd = 0;
    
    // Process each invoice
    invoices.forEach(invoice => {
      const paymentDate = new Date(invoice.payment_date);
      const year = paymentDate.getFullYear();
      const month = paymentDate.getMonth();
      
      // Create a month key (e.g., "2025-01")
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      // Get amount (use partially_paid_amount if available, otherwise total)
      const amount = invoice.status === 'partially_paid' && invoice.partially_paid_amount !== null
        ? invoice.partially_paid_amount
        : invoice.total;
      
      // Initialize month in map if it doesn't exist
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { inr: 0, usd: 0, total: 0 });
      }
      
      // Update month totals based on currency
      const monthData = monthMap.get(monthKey)!;
      if (invoice.currency === 'USD') {
        monthData.usd += amount;
        totalUsd += amount;
        
        // Add USD amount to total based on preferred currency
        if (preferredCurrency === 'USD') {
          monthData.total += amount; 
        } else {
          // Convert USD to INR for the total
          monthData.total += (amount * conversionRate);
        }
      } else {
        // INR
        monthData.inr += amount;
        totalInr += amount;
        
        // Add INR amount to total based on preferred currency
        if (preferredCurrency === 'INR') {
          monthData.total += amount;
        } else {
          // Convert INR to USD for the total
          monthData.total += (amount / conversionRate);
        }
      }
    });
    
    // Calculate grand total based on preferred currency
    const grandTotal = preferredCurrency === 'INR'
      ? totalInr + (totalUsd * conversionRate) // Convert USD to INR
      : (totalInr / conversionRate) + totalUsd; // Convert INR to USD
    
    // Format the data for the chart
    const history = Array.from(monthMap.entries())
      .map(([monthKey, data]) => {
        // Parse the monthKey to get a readable month name
        const [year, monthNum] = monthKey.split('-');
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[parseInt(monthNum) - 1];
        
        return {
          period: `${monthName} ${year}`,
          amount_inr: data.inr,
          amount_usd: data.usd,
          total: data.total
        };
      })
      .sort((a, b) => {
        // Sort by date (newest first)
        const [monthA, yearA] = a.period.split(' ');
        const [monthB, yearB] = b.period.split(' ');
        
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthIndexA = monthNames.indexOf(monthA);
        const monthIndexB = monthNames.indexOf(monthB);
        
        if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
        return monthIndexB - monthIndexA;
      });
    
    return {
      history,
      total: grandTotal,
      inr: totalInr,
      usd: totalUsd
    };
  };
  
  // Process invoices into client data
  const processClientData = (invoices: any[], preferredCurrency: string, conversionRate: number) => {
    // Create a map to hold client totals
    const clientMap = new Map<string, { 
      client_id: string, 
      client_name: string, 
      amount_inr: number, 
      amount_usd: number,
      total: number
    }>();
    
    // Calculate overall total for percentage calculation
    let overallTotal = 0;
    
    // Process each invoice
    invoices.forEach(invoice => {
      const clientId = invoice.client_id;
      const clientName = invoice.clients?.company_name || invoice.clients?.name || 'Unknown Client';
      
      // Get amount (use partially_paid_amount if available, otherwise total)
      const amount = invoice.status === 'partially_paid' && invoice.partially_paid_amount !== null
        ? invoice.partially_paid_amount
        : invoice.total;
      
      // Initialize client in map if it doesn't exist
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, { 
          client_id: clientId, 
          client_name: clientName, 
          amount_inr: 0, 
          amount_usd: 0,
          total: 0
        });
      }
      
      // Update client totals based on currency
      const clientData = clientMap.get(clientId)!;
      if (invoice.currency === 'USD') {
        clientData.amount_usd += amount;
        
        // Add to total based on preferred currency
        if (preferredCurrency === 'USD') {
          clientData.total += amount;
          overallTotal += amount;
        } else {
          // Convert USD to INR
          clientData.total += (amount * conversionRate);
          overallTotal += (amount * conversionRate);
        }
      } else {
        // INR
        clientData.amount_inr += amount;
        
        // Add to total based on preferred currency
        if (preferredCurrency === 'INR') {
          clientData.total += amount;
          overallTotal += amount;
        } else {
          // Convert INR to USD
          clientData.total += (amount / conversionRate);
          overallTotal += (amount / conversionRate);
        }
      }
    });
    
    // Calculate percentages and format the data
    return Array.from(clientMap.values())
      .map(client => ({
        ...client,
        percentage: overallTotal > 0
          ? Math.round((client.total / overallTotal) * 100)
          : 0
      }))
      .sort((a, b) => b.total - a.total); // Sort by highest total first
  };

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add headers
      csvContent += "Period,Revenue (INR),Revenue (USD),Total Revenue\n";
      
      // Add data rows from revenueHistory
      revenueHistory.forEach((item) => {
        csvContent += `${item.period},${item.amount_inr || 0},${item.amount_usd || 0},${item.total || 0}\n`;
      });
      
      // Add separator
      csvContent += "\n\nRevenue by Client\n";
      
      // Add headers for client breakdown
      csvContent += "Client,Revenue (INR),Revenue (USD),Total Revenue,Percentage\n";
      
      // Add client data
      revenueData.byClient.forEach((item: any) => {
        csvContent += `${item.client_name},${item.amount_inr || 0},${item.amount_usd || 0},${item.total || 0},${item.percentage}%\n`;
      });
      
      // Encode the CSV content
      const encodedUri = encodeURI(csvContent);
      
      // Create a link element and trigger the download
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `revenue_report_${formatDate(startDate)}_to_${formatDate(endDate)}.csv`);
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Format the date range for display
  const getDateRangeText = () => {
    if (viewMode === 'monthly') {
      return `${startDate.toLocaleString('default', { month: 'long', year: 'numeric' })} to ${endDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    } else if (viewMode === 'yearly') {
      return `${startDate.getFullYear()} to ${endDate.getFullYear()}`;
    } else {
      return `${formatDate(startDate)} to ${formatDate(endDate)}`;
    }
  };

  // Get the preferred currency
  const getPreferredCurrency = () => currencySettings?.preferred_currency || 'INR';

  const renderRevenueChart = () => {
    if (revenueHistory.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No revenue data available for the selected period</p>
        </div>
      );
    }

    // For this prototype, we'll use a simple bar representation
    // In a real app, you'd use a chart library like Chart.js or Recharts
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
        <h3 className="text-base font-medium mb-4">Revenue Trend</h3>
        <div className="flex h-64 items-end space-x-2">
          {revenueHistory.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className="w-12 bg-blue-500 hover:bg-blue-600 transition-all rounded-t-sm relative group cursor-pointer"
                style={{ 
                  height: `${Math.max(5, (item.total / Math.max(...revenueHistory.map(i => i.total || 0))) * 100)}%`
                }}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-1 rounded whitespace-nowrap">
                  {formatCurrency(item.total || 0, getPreferredCurrency())}
                </div>
              </div>
              <div className="text-xs mt-1 font-medium text-gray-600 whitespace-nowrap">
                {item.period}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Revenue Analysis
        </h1>
        
        <div className="flex items-center gap-4">
          {/* Currency Toggle */}
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Currency:</span>
            <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
            <span className="font-medium text-sm">
              {getPreferredCurrency()}
            </span>
            <Link to="/settings/currency" className="text-blue-500 hover:text-blue-600 text-xs ml-2">
              (Change)
            </Link>
          </div>
          
          <button
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
      
      {/* Date range and filter controls */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <DatePicker
                    id="start-date"
                    selected={startDate}
                    onChange={(date: Date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    maxDate={endDate}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    dateFormat="MMMM d, yyyy"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <DatePicker
                    id="end-date"
                    selected={endDate}
                    onChange={(date: Date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    dateFormat="MMMM d, yyyy"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-end gap-2">
              <div>
                <label htmlFor="view-mode" className="block text-sm font-medium text-gray-700 mb-1">
                  View Mode
                </label>
                <div className="relative">
                  <select
                    id="view-mode"
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as any)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="daily" disabled>Daily (Coming Soon)</option>
                    <option value="yearly" disabled>Yearly (Coming Soon)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronsUpDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={fetchRevenueData}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    Loading...
                  </span>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Revenue summary cards */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-3">
          Revenue Summary - {getDateRangeText()}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-xl font-semibold text-gray-900">
                  {isLoading ? (
                    <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    formatCurrency(revenueData.total || 0, getPreferredCurrency())
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3 mr-3">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">INR Revenue</p>
                <p className="text-xl font-semibold text-gray-900">
                  {isLoading ? (
                    <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    formatCurrency(revenueData.inr || 0, 'INR')
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-3 mr-3">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">USD Revenue</p>
                <p className="text-xl font-semibold text-gray-900">
                  {isLoading ? (
                    <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    formatCurrency(revenueData.usd || 0, 'USD')
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Revenue visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-6 h-64 flex items-center justify-center">
              <div className="loader h-10 w-10"></div>
            </div>
          ) : (
            renderRevenueChart()
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-medium text-gray-900">Revenue by Client</h3>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`p-1 rounded-md ${chartType === 'bar' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-500'}`}
              >
                <BarChart2 className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('pie')}
                className={`p-1 rounded-md ${chartType === 'pie' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-500'}`}
              >
                <PieChart className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="loader h-8 w-8"></div>
            </div>
          ) : revenueData.byClient.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No client data available</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-60">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.byClient.map((client: any, index: number) => (
                    <tr key={client.client_id || index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.client_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(client.total || 0, getPreferredCurrency())}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                        {client.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Detailed revenue table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Detailed Revenue History</h2>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="loader h-10 w-10"></div>
          </div>
        ) : revenueHistory.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No revenue data available for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    INR Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USD Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueHistory.map((item, index) => {
                  // Calculate growth rate compared to previous period
                  let growthRate = 0;
                  let growthClass = 'text-gray-500';
                  
                  if (index < revenueHistory.length - 1) {
                    const currentTotal = item.total || 0;
                    const prevTotal = revenueHistory[index + 1].total || 0;
                    
                    if (prevTotal > 0) {
                      growthRate = ((currentTotal - prevTotal) / prevTotal) * 100;
                      growthClass = growthRate > 0 
                        ? 'text-green-600' 
                        : growthRate < 0 
                          ? 'text-red-600' 
                          : 'text-gray-500';
                    }
                  }
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(item.amount_inr || 0, 'INR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(item.amount_usd || 0, 'USD')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatCurrency(item.total || 0, getPreferredCurrency())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {index < revenueHistory.length - 1 && (
                          <span className={`flex items-center justify-end ${growthClass}`}>
                            {growthRate > 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : growthRate < 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
                            ) : null}
                            {growthRate.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;