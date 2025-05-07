import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Expense } from '../../store/expenseStore';
import { 
  Calendar, 
  Tag, 
  DollarSign, 
  FileText, 
  Trash2, 
  Edit, 
  ExternalLink,
  CheckCircle,
  Building
} from 'lucide-react';

interface ExpenseItemProps {
  expense: Expense;
  onDelete: (id: string) => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setIsDeleting(true);
      try {
        await onDelete(expense.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <li className="group">
      <Link
        to={`/expenses/${expense.id}`}
        className="block hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between flex-wrap gap-y-2">
            <div className="flex items-center">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
                style={{ 
                  backgroundColor: expense.category?.color ? `${expense.category.color}15` : '#f3f4f6',
                  color: expense.category?.color || '#6b7280'
                }}
              >
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-xs sm:max-w-md">
                  {expense.description}
                </p>
                <div className="mt-1 flex items-center text-xs text-gray-500">
                  <Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" />
                  <span>{formatDate(expense.date)}</span>
                  
                  {expense.category && (
                    <>
                      <span className="mx-1.5">•</span>
                      <Tag className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" />
                      <span 
                        className="inline-flex items-center"
                        style={{ color: expense.category.color }}
                      >
                        {expense.category.name}
                      </span>
                    </>
                  )}
                  
                  {expense.client && (
                    <>
                      <span className="mx-1.5">•</span>
                      <Building className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" />
                      <span>{expense.client.company_name || expense.client.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {expense.is_billable && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Billable
                </span>
              )}
              
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(expense.amount, expense.currency)}
              </span>
            </div>
          </div>
          
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="flex items-center text-xs text-gray-500">
              {expense.receipt_url && (
                <a 
                  href={expense.receipt_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center mr-3 text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileText className="flex-shrink-0 mr-1 h-3.5 w-3.5" />
                  View Receipt
                  <ExternalLink className="ml-0.5 h-3 w-3" />
                </a>
              )}
              
              {expense.payment_method && (
                <span className="inline-flex items-center">
                  <DollarSign className="flex-shrink-0 mr-1 h-3.5 w-3.5 text-gray-400" />
                  {expense.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )}
            </div>
            
            <div className="mt-2 flex items-center text-xs sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Link
                to={`/expenses/${expense.id}/edit`}
                className="inline-flex items-center p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
              
              <button
                type="button"
                className="inline-flex items-center p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="h-4 w-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default ExpenseItem;