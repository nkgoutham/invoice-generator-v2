import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { 
  PlusCircle, 
  Search, 
  FileText, 
  Filter,
  SortAsc,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Send,
  Edit,
  CreditCard
} from 'lucide-react';
import { Invoice } from '../../lib/supabase';
import { formatCurrency, formatDate } from '../../utils/helpers';

const Invoices = () => {
  const { user } = useAuthStore();
  const { invoices, loading, error, fetchInvoices, updateInvoiceStatus } = useInvoiceStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  
  useEffect(() => {
    if (user) {
      fetchInvoices(user.id);
    }
  }, [user, fetchInvoices]);
  
  // Check for overdue invoices
  useEffect(() => {
    if (invoices && user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      invoices.forEach(invoice => {
        const dueDate = new Date(invoice.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        if ((invoice.status === 'sent' || invoice.status === 'partially_paid') && dueDate < today) {
          updateInvoiceStatus(invoice.id, 'overdue');
        }
      });
    }
  }, [invoices, user, updateInvoiceStatus]);
  
  // Apply filters, search, and sorting
  useEffect(() => {
    if (invoices) {
      let result = [...invoices];
      
      // Apply search
      if (searchTerm) {
        const lowercaseSearch = searchTerm.toLowerCase();
        result = result.filter(invoice => 
          invoice.invoice_number.toLowerCase().includes(lowercaseSearch) ||
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
      
      // Apply sorting
      switch (sortBy) {
        case 'date-desc':
          result.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
          break;
        case 'date-asc':
          result.sort((a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime());
          break;
        case 'amount-desc':
          result.sort((a, b) => b.total - a.total);
          break;
        case 'amount-asc':
          result.sort((a, b) => a.total - b.total);
          break;
        default:
          break;
      }
      
      setFilteredInvoices(result);
    }
  }, [invoices, searchTerm, statusFilter, sortBy]);
  
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    partially_paid: 'bg-yellow-100 text-yellow-800'
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 mr-1.5" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 mr-1.5" />;
      case 'sent':
        return <Clock className="h-4 w-4 mr-1.5" />;
      case 'partially_paid':
        return <DollarSign className="h-4 w-4 mr-1.5" />;
      default:
        return <FileText className="h-4 w-4 mr-1.5" />;
    }
  };
  
  if (loading && !invoices.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoices</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to="/invoices/new"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* Filters, search, and sort - Mobile optimized */}
      <div className="bg-white shadow rounded-lg mb-4 sm:mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search invoices..."
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
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            
            {/* Sort by */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SortAsc className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Date (Newest first)</option>
                <option value="date-asc">Date (Oldest first)</option>
                <option value="amount-desc">Amount (Highest first)</option>
                <option value="amount-asc">Amount (Lowest first)</option>
              </select>
            </div>
            
            {/* Invoice count */}
            <div className="flex items-center justify-start lg:justify-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Invoice list */}
      {filteredInvoices.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <li key={invoice.id}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <p className="text-sm font-medium text-blue-600 truncate mr-2">
                          {invoice.invoice_number}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs leading-5 font-semibold rounded-full ${
                            statusColors[invoice.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getStatusIcon(invoice.status)}
                          <span className="hidden sm:inline">
                            {invoice.status === 'partially_paid' 
                              ? 'Partially Paid' 
                              : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span className="truncate mr-2 hidden sm:inline">{formatDate(invoice.issue_date)}</span>
                        <span className="truncate sm:ml-2 sm:mr-2 hidden sm:inline">•</span>
                        <span className="truncate">Due: {formatDate(invoice.due_date)}</span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          Client: 
                          <span className="ml-1 font-medium text-gray-900">
                            {/* @ts-ignore */}
                            {invoice.clients?.company_name || invoice.clients?.name || 'Client'}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm sm:mt-0">
                        <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </span>
                        {invoice.status === 'partially_paid' && invoice.partially_paid_amount !== undefined && (
                          <span className="ml-1 text-xs text-green-600">
                            ({formatCurrency(invoice.partially_paid_amount, invoice.currency)} paid)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Link
                        to={`/invoices/${invoice.id}/view`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View Invoice
                      </Link>
                      
                      {/* Show different action buttons based on invoice status */}
                      {invoice.status === 'draft' ? (
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </Link>
                      ) : invoice.status === 'sent' || invoice.status === 'overdue' ? (
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CreditCard className="mr-1 h-4 w-4" />
                          Record Payment
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No invoices found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {invoices.length > 0
              ? "No invoices match your search criteria. Try adjusting your filters."
              : "Get started by creating your first invoice."}
          </p>
          {invoices.length === 0 && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/invoices/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Invoices;