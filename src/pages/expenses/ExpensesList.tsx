import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore, Expense } from '../../store/expenseStore';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  DollarSign,
  Calendar,
  Tag,
  ArrowDownUp,
  Plus
} from 'lucide-react';
import ExpenseItem from '../../components/expenses/ExpenseItem';
import ExpenseCategoryForm from '../../components/expenses/ExpenseCategoryForm';
import { formatCurrency } from '../../utils/helpers';

const ExpensesList = () => {
  const { user } = useAuthStore();
  const { expenses, categories, loading, error, fetchExpenses, fetchCategories, deleteExpense } = useExpenseStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Calculate total expenses
  const [totalAmount, setTotalAmount] = useState({ inr: 0, usd: 0 });
  
  useEffect(() => {
    if (user) {
      fetchExpenses(user.id);
      fetchCategories(user.id);
    }
  }, [user, fetchExpenses, fetchCategories]);
  
  // Apply filters and search
  useEffect(() => {
    if (expenses) {
      let result = [...expenses];
      
      // Apply search
      if (searchTerm) {
        const lowercaseSearch = searchTerm.toLowerCase();
        result = result.filter(expense => 
          expense.description.toLowerCase().includes(lowercaseSearch) ||
          expense.notes?.toLowerCase().includes(lowercaseSearch) ||
          expense.category?.name.toLowerCase().includes(lowercaseSearch) ||
          expense.client?.name?.toLowerCase().includes(lowercaseSearch) ||
          expense.client?.company_name?.toLowerCase().includes(lowercaseSearch)
        );
      }
      
      // Apply category filter
      if (categoryFilter !== 'all') {
        result = result.filter(expense => expense.category_id === categoryFilter);
      }
      
      // Apply date filter
      if (dateFilter !== 'all') {
        const today = new Date();
        const startDate = new Date();
        
        if (dateFilter === 'this-month') {
          startDate.setDate(1); // First day of current month
        } else if (dateFilter === 'last-month') {
          startDate.setMonth(today.getMonth() - 1, 1); // First day of last month
          today.setDate(0); // Last day of last month
        } else if (dateFilter === 'this-year') {
          startDate.setMonth(0, 1); // January 1st of current year
        } else if (dateFilter === 'last-30') {
          startDate.setDate(today.getDate() - 30); // 30 days ago
        } else if (dateFilter === 'last-90') {
          startDate.setDate(today.getDate() - 90); // 90 days ago
        }
        
        // Format dates to YYYY-MM-DD for comparison
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = today.toISOString().split('T')[0];
        
        result = result.filter(expense => 
          expense.date >= startDateStr && expense.date <= endDateStr
        );
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'date-desc':
          result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          break;
        case 'date-asc':
          result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          break;
        case 'amount-desc':
          result.sort((a, b) => b.amount - a.amount);
          break;
        case 'amount-asc':
          result.sort((a, b) => a.amount - b.amount);
          break;
        default:
          break;
      }
      
      setFilteredExpenses(result);
      
      // Calculate totals
      const totals = result.reduce(
        (acc, expense) => {
          if (expense.currency === 'INR') {
            acc.inr += expense.amount;
          } else {
            acc.usd += expense.amount;
          }
          return acc;
        },
        { inr: 0, usd: 0 }
      );
      
      setTotalAmount(totals);
    }
  }, [expenses, searchTerm, categoryFilter, dateFilter, sortBy]);
  
  const handleRefresh = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    await fetchExpenses(user.id);
    setTimeout(() => setIsRefreshing(false), 800); // Add a minimum delay for better UX
  };
  
  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
  };
  
  if (loading && !expenses.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader h-12 w-12"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-600 to-accent-500">
            Expenses 
          </span>
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link
            to="/expenses/new"
            className="w-full sm:w-auto btn btn-primary btn-md"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Link>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="w-full sm:w-auto btn btn-secondary btn-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Manage Categories
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-fade-in">
          {error}
        </div>
      )}
      
      {/* Filters and search */}
      <div className="card mb-6">
        <div className="p-4 border-b border-neutral-200/70">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 md:gap-4">
            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
              </div>
              <input
                type="text"
                className="form-input pl-10 w-full"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Category filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-4 w-4 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
              </div>
              <select
                className="form-select pl-10 w-full"
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
            
            {/* Date filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
              </div>
              <select
                className="form-select pl-10 w-full"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
                <option value="last-30">Last 30 Days</option>
                <option value="last-90">Last 90 Days</option>
              </select>
            </div>
            
            {/* Sort by */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowDownUp className="h-4 w-4 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
              </div>
              <select
                className="form-select pl-10 w-full"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Date (Newest first)</option>
                <option value="date-asc">Date (Oldest first)</option>
                <option value="amount-desc">Amount (Highest first)</option>
                <option value="amount-asc">Amount (Lowest first)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Summary */}
        <div className="p-4 bg-gray-50 border-b border-neutral-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-neutral-400 mr-2" />
              <span className="text-sm text-neutral-600">
                {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {totalAmount.inr > 0 && (
                <div className="text-sm font-medium">
                  <span className="text-neutral-500">INR:</span> {formatCurrency(totalAmount.inr, 'INR')}
                </div>
              )}
              
              {totalAmount.usd > 0 && (
                <div className="text-sm font-medium">
                  <span className="text-neutral-500">USD:</span> {formatCurrency(totalAmount.usd, 'USD')}
                </div>
              )}
              
              <button 
                onClick={handleRefresh} 
                className="btn btn-secondary btn-sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="ml-1.5">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expenses list */}
      {filteredExpenses.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <ExpenseItem 
                key={expense.id} 
                expense={expense} 
                onDelete={handleDeleteExpense} 
              />
            ))}
          </ul>
        </div>
      ) : (
        <div className="card p-5 sm:p-6 text-center animate-fade-in">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <DollarSign className="h-8 w-8" />
            </div>
          </div>
          <h3 className="mt-4 text-lg font-medium text-neutral-900">No expenses found</h3>
          <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
            {expenses.length > 0
              ? "No expenses match your search criteria. Try adjusting your filters."
              : "Get started by adding your first expense."}
          </p>
          {expenses.length === 0 && (
            <div className="mt-6">
              <Link
                to="/expenses/new"
                className="btn btn-primary btn-md"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCategoryModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowCategoryModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ExpenseCategoryForm />
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesList;