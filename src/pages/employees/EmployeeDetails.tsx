import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEmployeeStore } from '../../store/employeeStore';
import { useExpenseStore } from '../../store/expenseStore';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Briefcase,
  FileText,
  Plus
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EmployeeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedEmployee, fetchEmployee, deleteEmployee, loading } = useEmployeeStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  
  const [employeeExpenses, setEmployeeExpenses] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchEmployee(id);
    }
    
    if (user) {
      fetchExpenses(user.id);
    }
  }, [id, user, fetchEmployee, fetchExpenses]);
  
  // Filter expenses for this employee
  useEffect(() => {
    if (id && expenses.length > 0) {
      const filteredExpenses = expenses.filter(expense => 
        expense.employee_id === id && expense.is_salary
      );
      setEmployeeExpenses(filteredExpenses);
    }
  }, [id, expenses]);
  
  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this employee? This cannot be undone.')) {
      setIsDeleting(true);
      try {
        await deleteEmployee(id);
        toast.success('Employee deleted successfully');
        navigate('/employees');
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  if (loading || !selectedEmployee) {
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
          <Link to="/employees" className="text-gray-500 hover:text-gray-700 mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">{selectedEmployee.name}</h1>
        </div>
        
        {/* Action buttons with improved mobile layout */}
        <div className="grid grid-cols-3 gap-2">
          <Link
            to={`/employees/${id}/edit`}
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
          <Link
            to={`/expenses/new?employee=${id}`}
            className="flex flex-col items-center justify-center py-2 px-1 sm:py-3 sm:px-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-center shadow-sm"
          >
            <Plus size={16} className="mb-1" />
            <span className="text-xs font-medium">Add Salary</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg font-semibold mb-4">Employee Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {selectedEmployee.designation && (
            <div className="flex items-start space-x-3">
              <Briefcase className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Designation</p>
                <p className="font-medium">{selectedEmployee.designation}</p>
              </div>
            </div>
          )}
          
          {selectedEmployee.email && (
            <div className="flex items-start space-x-3">
              <Mail className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div className="overflow-hidden">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium truncate">{selectedEmployee.email}</p>
              </div>
            </div>
          )}
          
          {selectedEmployee.phone && (
            <div className="flex items-start space-x-3">
              <Phone className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{selectedEmployee.phone}</p>
              </div>
            </div>
          )}
          
          {selectedEmployee.join_date && (
            <div className="flex items-start space-x-3">
              <Calendar className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Join Date</p>
                <p className="font-medium">{formatDate(selectedEmployee.join_date)}</p>
              </div>
            </div>
          )}
          
          {selectedEmployee.monthly_salary && (
            <div className="flex items-start space-x-3">
              <DollarSign className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Monthly Salary</p>
                <p className="font-medium">
                  {formatCurrency(selectedEmployee.monthly_salary, selectedEmployee.currency_preference || 'INR')}
                </p>
              </div>
            </div>
          )}
          
          {selectedEmployee.hourly_rate && (
            <div className="flex items-start space-x-3">
              <DollarSign className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Hourly Rate</p>
                <p className="font-medium">
                  {formatCurrency(selectedEmployee.hourly_rate, selectedEmployee.currency_preference || 'INR')}/hr
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-start space-x-3">
            <DollarSign className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="font-medium">{selectedEmployee.currency_preference || 'INR'}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Briefcase className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{selectedEmployee.status || 'Active'}</p>
            </div>
          </div>
        </div>
        
        {selectedEmployee.notes && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-md font-medium mb-2">Notes</h3>
            <p className="text-gray-700 whitespace-pre-line">{selectedEmployee.notes}</p>
          </div>
        )}
      </div>
      
      {/* Salary History */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Salary History</h2>
            <Link
              to={`/expenses/new?employee=${id}&is_salary=true`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Salary Payment
            </Link>
          </div>
        </div>
        
        {employeeExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeeExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.salary_type ? (
                        <span className="capitalize">{expense.salary_type}</span>
                      ) : (
                        'Salary'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Link to={`/expenses/${expense.id}`} className="hover:text-blue-600">
                        {expense.description}
                        {expense.salary_type === 'hourly' && expense.hours_worked && (
                          <span className="text-gray-500 ml-1">
                            ({expense.hours_worked} hours)
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No salary payments yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Record salary payments for this employee to track expenses.
            </p>
            <div className="mt-6">
              <Link
                to={`/expenses/new?employee=${id}&is_salary=true`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="mr-2 -ml-1 h-5 w-5" />
                Record Salary Payment
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetails;