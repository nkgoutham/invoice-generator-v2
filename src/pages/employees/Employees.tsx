import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEmployeeStore } from '../../store/employeeStore';
import { 
  PlusCircle, 
  Search, 
  Users, 
  Filter,
  Mail,
  Phone,
  RefreshCw,
  ArrowRight,
  DollarSign,
  Briefcase,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { Employee } from '../../lib/supabase';

const Employees = () => {
  const { user } = useAuthStore();
  const { employees, loading, error, fetchEmployees } = useEmployeeStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchEmployees(user.id);
    }
  }, [user, fetchEmployees]);
  
  // Apply filters and search
  useEffect(() => {
    if (employees) {
      let result = [...employees];
      
      // Apply search
      if (searchTerm) {
        const lowercaseSearch = searchTerm.toLowerCase();
        result = result.filter(employee => 
          employee.name.toLowerCase().includes(lowercaseSearch) ||
          (employee.email && employee.email.toLowerCase().includes(lowercaseSearch)) ||
          (employee.designation && employee.designation.toLowerCase().includes(lowercaseSearch))
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        result = result.filter(employee => employee.status === statusFilter);
      }
      
      setFilteredEmployees(result);
    }
  }, [employees, searchTerm, statusFilter]);
  
  const handleRefresh = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    await fetchEmployees(user.id);
    setTimeout(() => setIsRefreshing(false), 800); // Add a minimum delay for better UX
  };

  if (loading && !employees.length) {
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
            Employees
          </span>
        </h1>
        <Link
          to="/employees/new"
          className="w-full sm:w-auto btn btn-primary btn-md"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Employee
        </Link>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-fade-in">
          {error}
        </div>
      )}
      
      {/* Filters and search */}
      <div className="card mb-6">
        <div className="p-4 border-b border-neutral-200/70">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
              </div>
              <input
                type="text"
                className="form-input pl-10 w-full"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Status filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
              </div>
              <select
                className="form-select pl-10 w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            {/* Employee count and refresh button */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-neutral-400 mr-2" />
                <span className="text-sm text-neutral-600">
                  {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
                </span>
              </div>
              
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
      
      {/* Employees grid with improved mobile layout */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <Link
              key={employee.id}
              to={`/employees/${employee.id}`}
              className="card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 flex flex-col group"
            >
              <div className="p-4 sm:p-5 flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-base sm:text-lg font-medium text-neutral-900 truncate max-w-[70%] group-hover:text-accent-600 transition-colors">
                    {employee.name}
                  </h3>
                  <span
                    className={`badge ${
                      employee.status === 'active' ? 'badge-success' : 'badge-neutral'
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>
                
                {employee.designation && (
                  <div className="mt-3 flex items-center text-sm text-neutral-600">
                    <Briefcase className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400" />
                    <span className="truncate">{employee.designation}</span>
                  </div>
                )}
                
                {employee.email && (
                  <div className="mt-2 flex items-center text-sm text-neutral-600">
                    <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                )}
                
                {employee.phone && (
                  <div className="mt-2 flex items-center text-sm text-neutral-600">
                    <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {employee.monthly_salary && (
                    <div className="flex items-center text-sm text-neutral-600">
                      <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400" />
                      <span>
                        {formatCurrency(employee.monthly_salary, employee.currency_preference || 'INR')}/mo
                      </span>
                    </div>
                  )}
                  
                  {employee.hourly_rate && (
                    <div className="flex items-center text-sm text-neutral-600">
                      <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400" />
                      <span>
                        {formatCurrency(employee.hourly_rate, employee.currency_preference || 'INR')}/hr
                      </span>
                    </div>
                  )}
                  
                  {employee.join_date && (
                    <div className="flex items-center text-sm text-neutral-600">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400" />
                      <span>
                        {new Date(employee.join_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-neutral-50 px-4 sm:px-5 py-3 mt-auto rounded-b-xl border-t border-neutral-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600">
                    <span className="font-medium text-neutral-800">
                      {employee.currency_preference || 'INR'}
                    </span>
                  </span>
                  <span className="text-accent-600 font-medium flex items-center">
                    View details
                    <ArrowRight className="ml-1 h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" /> 
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-5 sm:p-6 text-center animate-fade-in">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <Users className="h-8 w-8" />
            </div>
          </div>
          <h3 className="mt-4 text-lg font-medium text-neutral-900">No employees found</h3>
          <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
            {employees.length > 0
              ? "No employees match your search criteria. Try adjusting your filters."
              : "Get started by adding your first employee."}
          </p>
          {employees.length === 0 && (
            <div className="mt-6">
              <Link
                to="/employees/new"
                className="btn btn-primary btn-md"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Employee
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Employees;