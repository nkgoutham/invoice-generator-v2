import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useExpenseStore } from '../../store/expenseStore';
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  DollarSign, 
  FileText, 
  Trash2, 
  Edit, 
  ExternalLink,
  Building,
  CheckCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  User
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ExpenseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedExpense, fetchExpense, deleteExpense, loading } = useExpenseStore();
  
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchExpense(id);
    }
  }, [id, fetchExpense]);
  
  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setIsDeleting(true);
      try {
        await deleteExpense(id);
        toast.success('Expense deleted successfully');
        navigate('/expenses');
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  if (loading || !selectedExpense) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link to="/expenses" className="text-gray-500 hover:text-gray-700 mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">{selectedExpense.description}</h1>
        </div>
        
        {/* Action buttons with improved mobile layout */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/expenses/${id}/edit`}
            className="flex flex-col items-center justify-center py-2 px-1 sm:py-3 sm:px-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-center shadow-sm"
          >
            <Edit size={16} className="mb-1" />
            <span className="text-xs font-medium">Edit</span>
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex flex-col items-center justify-center py-2 px-1 sm:py-3 sm:px-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-center shadow-sm"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                <span className="text-xs font-medium">Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} className="mb-1" />
                <span className="text-xs font-medium">Delete</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg font-semibold mb-4">Expense Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-start space-x-3">
            <Calendar className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{formatDate(selectedExpense.date)}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <DollarSign className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">{formatCurrency(selectedExpense.amount, selectedExpense.currency)}</p>
            </div>
          </div>
          
          {selectedExpense.category && (
            <div className="flex items-start space-x-3">
              <Tag className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p 
                  className="font-medium"
                  style={{ color: selectedExpense.category.color }}
                >
                  {selectedExpense.category.name}
                </p>
              </div>
            </div>
          )}
          
          {selectedExpense.payment_method && (
            <div className="flex items-start space-x-3">
              <CreditCard className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">
                  {selectedExpense.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            </div>
          )}
          
          {selectedExpense.client && (
            <div className="flex items-start space-x-3">
              <Building className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{selectedExpense.client.company_name || selectedExpense.client.name}</p>
              </div>
            </div>
          )}
          
          {selectedExpense.is_recurring && (
            <div className="flex items-start space-x-3">
              <RefreshCw className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Recurring</p>
                <p className="font-medium">
                  {selectedExpense.recurring_frequency?.charAt(0).toUpperCase() + 
                    selectedExpense.recurring_frequency?.slice(1) || 'Yes'}
                </p>
              </div>
            </div>
          )}
            
            {selectedExpense.is_salary && selectedExpense.employee && (
              <div className="flex items-start space-x-3">
                <User className="text-gray-500 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium">{selectedExpense.employee.name}</p>
                  {selectedExpense.employee.designation && (
                    <p className="text-sm text-gray-500">{selectedExpense.employee.designation}</p>
                  )}
                </div>
              </div>
            )}
            
            {selectedExpense.is_salary && selectedExpense.salary_type && (
              <div className="flex items-start space-x-3">
                <DollarSign className="text-gray-500 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Salary Type</p>
                  <p className="font-medium">
                    {selectedExpense.salary_type.charAt(0).toUpperCase() + selectedExpense.salary_type.slice(1)}
                    {selectedExpense.salary_type === 'hourly' && selectedExpense.hours_worked && (
                      <span className="ml-1 text-sm text-gray-500">
                        ({selectedExpense.hours_worked} hours)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Status Indicators */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {selectedExpense.is_billable && (
            <div className="bg-blue-50 p-3 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-700">Billable</p>
                <p className="text-xs text-blue-600">This expense is billable to a client</p>
              </div>
            </div>
          )}
          
          {selectedExpense.is_reimbursable && (
            <div className="bg-amber-50 p-3 rounded-lg flex items-center">
              <DollarSign className="h-5 w-5 text-amber-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-amber-700">Reimbursable</p>
                <p className="text-xs text-amber-600">
                  {selectedExpense.reimbursed ? 'Has been reimbursed' : 'Pending reimbursement'}
                </p>
              </div>
            </div>
          )}
          
          {selectedExpense.is_recurring && (
            <div className="bg-purple-50 p-3 rounded-lg flex items-center">
              <RefreshCw className="h-5 w-5 text-purple-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-700">Recurring</p>
                <p className="text-xs text-purple-600">
                  {selectedExpense.recurring_frequency?.charAt(0).toUpperCase() + 
                    selectedExpense.recurring_frequency?.slice(1) || 'Regular expense'}
                </p>
              </div>
            </div>
          )}
            
            {selectedExpense.is_salary && (
              <div className="bg-purple-50 p-3 rounded-lg flex items-center">
                <User className="h-5 w-5 text-purple-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-purple-700">Employee Salary</p>
                  <p className="text-xs text-purple-600">
                    {selectedExpense.salary_type === 'hourly' 
                      ? `Hourly payment (${selectedExpense.hours_worked} hours)` 
                      : selectedExpense.salary_type === 'monthly'
                      ? 'Monthly salary'
                      : selectedExpense.salary_type === 'project'
                      ? 'Project-based payment'
                      : 'Salary payment'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      
      {/* Notes and Receipt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {selectedExpense.notes && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-line">{selectedExpense.notes}</p>
          </div>
        )}
        
        {selectedExpense.receipt_url && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Receipt</h2>
            {selectedExpense.receipt_url.toLowerCase().endsWith('.pdf') ? (
              <div className="flex flex-col items-center">
                <FileText className="h-16 w-16 text-gray-400 mb-2" />
                <a 
                  href={selectedExpense.receipt_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View Receipt
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="mb-2 max-h-64 overflow-hidden rounded-md">
                  <img 
                    src={selectedExpense.receipt_url} 
                    alt="Receipt" 
                    className="object-contain max-h-64 w-auto"
                  />
                </div>
                <a 
                  href={selectedExpense.receipt_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View Full Size
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseDetails;