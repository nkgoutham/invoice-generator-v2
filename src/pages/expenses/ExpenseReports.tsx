import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useClientStore } from '../../store/clientStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { 
  Calendar, 
  Download, 
  Filter, 
  RefreshCw, 
  ArrowLeft,
  FileText,
  DollarSign,
  Tag,
  Building
} from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatCurrency } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import ExpenseCharts from '../../components/expenses/ExpenseCharts';
import toast from 'react-hot-toast';

const ExpenseReports = () => {
  const { user } = useAuthStore();
  const { expenses, categories, fetchExpenses, fetchCategories, loading } = useExpenseStore();
  const { clients, fetchClients } = useClientStore();
  const { currencySettings, fetchCurrencySettings } = useCurrencyStore();
  
  const [startDate, setStartDate] = useState<Date>(() => {
    // Default to first day of current month
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  
  const [endDate, setEndDate] = useState<Date>(() => {
    // Default to today
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [billableFilter, setBillableFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filtered expenses
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  
  // Summary data
  const [summary, setSummary] = useState({
    totalINR: 0,
    totalUSD: 0,
    billableINR: 0,
    billableUSD: 0,
    reimbursableINR: 0,
    reimbursableUSD: 0,
    count: 0
  });
  
  useEffect(() => {
    if (user) {
      fetchExpenses(user.id);
      fetchCategories(user.id);
      fetchClients(user.id);
      fetchCurrencySettings(user.id);
    }
  }, [user, fetchExpenses, fetchCategories, fetchClients, fetchCurrencySettings]);
  
  // Apply filters
  useEffect(() => {
    if (expenses.length > 0) {
      let filtered = [...expenses];
      
      // Date range filter
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
      
      // Category filter
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(expense => expense.category_id === categoryFilter);
      }
      
      // Client filter
      if (clientFilter !== 'all') {
        filtered = filtered.filter(expense => expense.client_id === clientFilter);
      }
      
      // Billable filter
      if (billableFilter !== 'all') {
        if (billableFilter === 'billable') {
          filtered = filtered.filter(expense => expense.is_billable);
        } else if (billableFilter === 'non-billable') {
          filtered = filtered.filter(expense => !expense.is_billable);
        } else if (billableFilter === 'reimbursable') {
          filtered = filtered.filter(expense => expense.is_reimbursable);
        }
      }
      
      // Currency filter
      if (currencyFilter !== 'all') {
        filtered = filtered.filter(expense => expense.currency === currencyFilter);
      }
      
      // Calculate summary
      const summaryData = filtered.reduce((acc, expense) => {
        // Increment count
        acc.count++;
        
        // Add to total based on currency
        if (expense.currency === 'INR') {
          acc.totalINR += expense.amount;
          
          // Add to billable/reimbursable if applicable
          if (expense.is_billable) acc.billableINR += expense.amount;
          if (expense.is_reimbursable) acc.reimbursableINR += expense.amount;
        } else {
          acc.totalUSD += expense.amount;
          
          // Add to billable/reimbursable if applicable
          if (expense.is_billable) acc.billableUSD += expense.amount;
          if (expense.is_reimbursable) acc.reimbursableUSD += expense.amount;
        }
        
        return acc;
      }, {
        totalINR: 0,
        totalUSD: 0,
        billableINR: 0,
        billableUSD: 0,
        reimbursableINR: 0,
        reimbursableUSD: 0,
        count: 0
      });
      
      setFilteredExpenses(filtered);
      setSummary(summaryData);
    }
  }, [expenses, startDate, endDate, categoryFilter, clientFilter, billableFilter, currencyFilter]);
  
  const handleRefresh = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    await fetchExpenses(user.id);
    setTimeout(() => setIsRefreshing(false), 800);
  };
  
  const handleExport = () => {
    setIsExporting(true);
    
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add headers
      csvContent += "Date,Description,Category,Amount,Currency,Client,Billable,Reimbursable,Payment Method,Notes\n";
      
      // Add data rows
      filteredExpenses.forEach(expense => {
        const row = [
          expense.date,
          `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes in description
          expense.category?.name || '',
          expense.amount,
          expense.currency,
          expense.client?.name || '',
          expense.is_billable ? 'Yes' : 'No',
          expense.is_reimbursable ? 'Yes' : 'No',
          expense.payment_method || '',
          `"${(expense.notes || '').replace(/"/g, '""')}"` // Escape quotes in notes
        ];
        
        csvContent += row.join(",") + "\n";
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `expense_report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
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
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Link to="/expenses" className="text-gray-500 hover:text-gray-700 mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Expense Reports</h1>
        </div>
        
        <button
          onClick={handleExport}
          disabled={isExporting || loading || filteredExpenses.length === 0}
          className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <DatePicker
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="relative">
                <DatePicker
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
            
            {/* Category Filter */}
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="category-filter"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Client Filter */}
            <div>
              <label htmlFor="client-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="client-filter"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option value="all">All Clients</option>
                  <option value="none">No Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company_name ? `${client.name} (${client.company_name})` : client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Billable Filter */}
            <div>
              <label htmlFor="billable-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="billable-filter"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={billableFilter}
                onChange={(e) => setBillableFilter(e.target.value)}
              >
                <option value="all">All Expenses</option>
                <option value="billable">Billable Only</option>
                <option value="non-billable">Non-Billable Only</option>
                <option value="reimbursable">Reimbursable Only</option>
              </select>
            </div>
            
            {/* Currency Filter */}
            <div>
              <label htmlFor="currency-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency-filter"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
              >
                <option value="all">All Currencies</option>
                <option value="INR">INR Only</option>
                <option value="USD">USD Only</option>
              </select>
            </div>
            
            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-xl font-semibold mt-1">{summary.count}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Total Amount (INR)</p>
              <p className="text-xl font-semibold mt-1">{formatCurrency(summary.totalINR, 'INR')}</p>
            </div>
            
            {summary.totalUSD > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Total Amount (USD)</p>
                <p className="text-xl font-semibold mt-1">{formatCurrency(summary.totalUSD, 'USD')}</p>
              </div>
            )}
            
            {summary.billableINR > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Billable (INR)</p>
                <p className="text-xl font-semibold mt-1">{formatCurrency(summary.billableINR, 'INR')}</p>
              </div>
            )}
            
            {summary.billableUSD > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Billable (USD)</p>
                <p className="text-xl font-semibold mt-1">{formatCurrency(summary.billableUSD, 'USD')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Expense Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">Visual breakdown of your expenses</p>
        </div>
        
        <div className="p-4 sm:p-6">
          <ExpenseCharts 
            expenses={filteredExpenses} 
            categories={categories} 
            clients={clients}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>
      
      {/* Expense Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Expense Details</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} for the selected period
          </p>
        </div>
        
        {filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Link to={`/expenses/${expense.id}`} className="hover:text-blue-600">
                        {expense.description}
                      </Link>
                      {expense.receipt_url && (
                        <a 
                          href={expense.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Receipt
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {expense.category ? (
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${expense.category.color}20`,
                            color: expense.category.color
                          }}
                        >
                          {expense.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.client ? (
                        expense.client.company_name || expense.client.name
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex flex-col items-center space-y-1">
                        {expense.is_billable && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Billable
                          </span>
                        )}
                        {expense.is_reimbursable && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            {expense.reimbursed ? 'Reimbursed' : 'Reimbursable'}
                          </span>
                        )}
                        {expense.is_recurring && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Recurring
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No expenses match your filter criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseReports;