import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRecurringInvoiceStore } from '../../store/recurringInvoiceStore';
import { 
  PlusCircle, 
  Search, 
  RefreshCw, 
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { RecurringInvoice } from '../../lib/supabase';
import { FREQUENCY_OPTIONS } from '../../types/invoice';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const RecurringInvoices = () => {
  const { user } = useAuthStore();
  const { recurringInvoices, loading, error, fetchRecurringInvoices, toggleRecurringInvoiceStatus } = useRecurringInvoiceStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredInvoices, setFilteredInvoices] = useState<RecurringInvoice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecurringInvoices(user.id);
    }
  }, [user, fetchRecurringInvoices]);
  
  // Apply filters and search
  useEffect(() => {
    if (recurringInvoices) {
      let result = [...recurringInvoices];
      
      // Apply search
      if (searchTerm) {
        const lowercaseSearch = searchTerm.toLowerCase();
        result = result.filter(invoice => 
          invoice.title.toLowerCase().includes(lowercaseSearch) ||
          // @ts-ignore
          (invoice.clients?.name && invoice.clients.name.toLowerCase().includes(lowercaseSearch)) ||
          // @ts-ignore
          (invoice.clients?.company_name && invoice.clients.company_name.toLowerCase().includes(lowercaseSearch))
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        result = result.filter(invoice => invoice.status === statusFilter);
      }
      
      setFilteredInvoices(result);
    }
  }, [recurringInvoices, searchTerm, statusFilter]);

  const handleRefresh = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    await fetchRecurringInvoices(user.id);
    setTimeout(() => setIsRefreshing(false), 800); // Add a minimum delay for better UX
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await toggleRecurringInvoiceStatus(id, newStatus as 'active' | 'inactive');
      toast.success(`Recurring invoice ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update recurring invoice status');
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const option = FREQUENCY_OPTIONS.find(opt => opt.value === frequency);
    return option ? option.label : frequency;
  };
  
  if (loading && !recurringInvoices.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader h-12 w-12"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Recurring Invoices</h1>
        <Link
          to="/recurring/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Recurring Invoice
        </Link>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* Filters, search, and sort */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search recurring invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Status filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            {/* Recurring invoice count */}
            <div className="flex items-center justify-start lg:justify-center">
              <RefreshCw className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">
                {filteredInvoices.length} recurring invoice{filteredInvoices.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Refresh Button */}
            <div className="flex justify-end">
              <button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recurring Invoice List */}
      {filteredInvoices.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredInvoices.map((recurringInvoice) => (
              <li key={recurringInvoice.id}>
                <Link
                  to={`/recurring/${recurringInvoice.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <p className="text-sm font-medium text-blue-600 truncate mr-2">
                          {recurringInvoice.title}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            recurringInvoice.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {recurringInvoice.status === 'active' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {recurringInvoice.status.charAt(0).toUpperCase() + recurringInvoice.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span className="truncate mr-2 hidden sm:inline">Next: {formatDate(recurringInvoice.next_issue_date)}</span>
                        <span className="truncate sm:ml-2 sm:mr-2 hidden sm:inline">•</span>
                        <span className="truncate">{getFrequencyLabel(recurringInvoice.frequency)}</span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          Client: 
                          <span className="ml-1 font-medium text-gray-900">
                            {/* @ts-ignore */}
                            {recurringInvoice.clients?.company_name || recurringInvoice.clients?.name || 'Client'}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm sm:mt-0">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">
                          Created: {formatDate(recurringInvoice.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleStatus(recurringInvoice.id, recurringInvoice.status);
                        }}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-md ${
                          recurringInvoice.status === 'active'
                            ? 'text-red-700 bg-red-50 hover:bg-red-100'
                            : 'text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {recurringInvoice.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <div className="text-sm font-medium text-blue-600 flex items-center">
                        View details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No recurring invoices found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {recurringInvoices.length > 0
              ? "No recurring invoices match your search criteria. Try adjusting your filters."
              : "Get started by creating your first recurring invoice."}
          </p>
          {recurringInvoices.length === 0 && (
            <div className="mt-6">
              <Link
                to="/recurring/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Recurring Invoice
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringInvoices;