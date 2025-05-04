import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCurrencyStore } from '../../store/currencyStore';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ArrowDown, ArrowUp, Calendar, Download, Filter, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const Earnings = () => {
  const { user } = useAuthStore();
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
  
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'monthly'>('monthly');
  const [sortField, setSortField] = useState<string>('period');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch currency settings on component mount
  useEffect(() => {
    if (user) {
      fetchCurrencySettings(user.id);
    }
  }, [user, fetchCurrencySettings]);
  
  // Fetch revenue data when date range changes
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
      const monthlyData = processMonthlyData(invoices || [], preferredCurrency, conversionRate);
      
      // Set revenue data state with sorting
      setRevenueHistory(sortData(monthlyData.history, sortField, sortDirection));
      
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      
      let errorMessage = 'Failed to fetch revenue data';
      
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      toast.error(errorMessage);
      
      // Set default empty data on error
      setRevenueHistory([]);
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
    
    // Format the data for the table
    const history = Array.from(monthMap.entries())
      .map(([monthKey, data]) => {
        // Parse the monthKey to get a readable month name
        const [year, monthNum] = monthKey.split('-');
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[parseInt(monthNum) - 1];
        
        // Create a sortable date for the period
        const sortableDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        
        return {
          period: `${monthName} ${year}`,
          monthNumber: parseInt(monthNum),
          year: parseInt(year),
          sortableDate,
          amount_inr: data.inr,
          amount_usd: data.usd,
          total: data.total
        };
      });
    
    return {
      history,
      total: grandTotal,
      inr: totalInr,
      usd: totalUsd
    };
  };
  
  // Sort the revenue history data
  const sortData = (data: any[], field: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      if (field === 'period') {
        // Sort by date
        const dateA = a.sortableDate.getTime();
        const dateB = b.sortableDate.getTime();
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (field === 'amount_inr' || field === 'amount_usd' || field === 'total') {
        // Sort by amount
        return direction === 'asc' 
          ? a[field] - b[field] 
          : b[field] - a[field];
      }
      return 0;
    });
  };

  // Handle sort change
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
    
    // Apply sorting
    setRevenueHistory(prev => sortData(prev, field, 
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    ));
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
    return `${startDate.toLocaleString('default', { month: 'long', year: 'numeric' })} to ${endDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  };

  // Get the preferred currency
  const getPreferredCurrency = () => currencySettings?.preferred_currency || 'INR';
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Revenue Report
        </h1>
        
        <button
          onClick={handleExport}
          disabled={isExporting || isLoading || revenueHistory.length === 0}
          className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
      
      {/* Date range and filter controls */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            
            <div className="flex items-end">
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
      
      {/* Revenue Report Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Revenue Report: {getDateRangeText()}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monthly revenue breakdown in {getPreferredCurrency()}
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : revenueHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No revenue data available for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('period')}
                  >
                    <div className="flex items-center">
                      Period
                      {sortField === 'period' && (
                        sortDirection === 'asc' ? 
                          <ArrowUp className="ml-1 h-3 w-3" /> :
                          <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount_inr')}
                  >
                    <div className="flex items-center justify-end">
                      INR Revenue
                      {sortField === 'amount_inr' && (
                        sortDirection === 'asc' ? 
                          <ArrowUp className="ml-1 h-3 w-3" /> :
                          <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount_usd')}
                  >
                    <div className="flex items-center justify-end">
                      USD Revenue
                      {sortField === 'amount_usd' && (
                        sortDirection === 'asc' ? 
                          <ArrowUp className="ml-1 h-3 w-3" /> :
                          <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center justify-end">
                      Total Revenue
                      {sortField === 'total' && (
                        sortDirection === 'asc' ? 
                          <ArrowUp className="ml-1 h-3 w-3" /> :
                          <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueHistory.map((item, index) => {
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
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                    {formatCurrency(
                      revenueHistory.reduce((sum, item) => sum + (item.amount_inr || 0), 0),
                      'INR'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                    {formatCurrency(
                      revenueHistory.reduce((sum, item) => sum + (item.amount_usd || 0), 0),
                      'USD'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                    {formatCurrency(
                      revenueHistory.reduce((sum, item) => sum + (item.total || 0), 0),
                      getPreferredCurrency()
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;