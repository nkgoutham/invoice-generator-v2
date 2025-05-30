import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useClientStore } from '../../store/clientStore';
import { useEmployeeStore } from '../../store/employeeStore';
import { ArrowLeft, Upload, Calendar, DollarSign, Tag, Building, FileText, Trash2, Plus, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'other', label: 'Other' }
];

const RECURRING_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

const SALARY_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'project', label: 'Project-based' },
  { value: 'other', label: 'Other' }
];

const EditExpense = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedExpense, fetchExpense, updateExpense, uploadReceipt, categories, fetchCategories, loading } = useExpenseStore();
  const { clients, fetchClients } = useClientStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: '',
      category_id: '',
      is_recurring: false,
      is_billable: false,
      is_reimbursable: false,
      reimbursed: false,
      currency: 'INR'
    }
  });
  
  const watchIsRecurring = watch('is_recurring');
  const watchIsBillable = watch('is_billable');
  const watchIsReimbursable = watch('is_reimbursable');
  const watchIsSalary = watch('is_salary');
  const watchSalaryType = watch('salary_type');
  const watchEmployeeId = watch('employee_id');
  
  // Fetch expense details and dependent data
  useEffect(() => {
    if (id) {
      fetchExpense(id);
    }
    
    if (user) {
      fetchCategories(user.id);
      fetchClients(user.id);
      fetchEmployees(user.id);
    }
  }, [id, user, fetchExpense, fetchCategories, fetchClients, fetchEmployees]);
  
  // Populate form with expense data when loaded
  useEffect(() => {
    if (selectedExpense) {
      setValue('date', selectedExpense.date);
      setValue('amount', selectedExpense.amount);
      setValue('description', selectedExpense.description);
      setValue('category_id', selectedExpense.category_id || '');
      setValue('client_id', selectedExpense.client_id || '');
      setValue('invoice_id', selectedExpense.invoice_id || '');
      setValue('is_recurring', selectedExpense.is_recurring || false);
      setValue('recurring_frequency', selectedExpense.recurring_frequency || '');
      setValue('notes', selectedExpense.notes || '');
      setValue('is_billable', selectedExpense.is_billable || false);
      setValue('is_reimbursable', selectedExpense.is_reimbursable || false);
      setValue('reimbursed', selectedExpense.reimbursed || false);
      setValue('payment_method', selectedExpense.payment_method || '');
      setValue('currency', selectedExpense.currency || 'INR');
      setValue('is_salary', selectedExpense.is_salary || false);
      setValue('employee_id', selectedExpense.employee_id || '');
      setValue('salary_type', selectedExpense.salary_type || '');
      setValue('hours_worked', selectedExpense.hours_worked || 0);
      
      if (selectedExpense.receipt_url) {
        setReceiptPreview(selectedExpense.receipt_url);
      }
    }
  }, [selectedExpense, setValue]);
  
  // When an employee is selected, pre-fill some fields based on employee data
  useEffect(() => {
    if (watchEmployeeId && watchIsSalary) {
      const selectedEmployee = employees.find(emp => emp.id === watchEmployeeId);
      if (selectedEmployee) {
        // Set currency based on employee preference
        if (selectedEmployee.currency_preference) {
          setValue('currency', selectedEmployee.currency_preference);
        }
        
        // If salary type is monthly and monthly_salary is set, use that as amount
        if (watchSalaryType === 'monthly' && selectedEmployee.monthly_salary) {
          setValue('amount', selectedEmployee.monthly_salary);
        }
      }
    }
  }, [watchEmployeeId, watchIsSalary, watchSalaryType, employees, setValue]);
  
  // Calculate amount for hourly salary when hours change
  const handleHoursWorkedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (watchIsSalary && watchSalaryType === 'hourly' && watchEmployeeId) {
      const hours = parseFloat(e.target.value) || 0;
      setValue('hours_worked', hours);
      
      const selectedEmployee = employees.find(emp => emp.id === watchEmployeeId);
      if (selectedEmployee && selectedEmployee.hourly_rate) {
        const amount = hours * selectedEmployee.hourly_rate;
        setValue('amount', amount);
      }
    }
  };
  
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs, just show the file name
        setReceiptPreview(null);
      }
    }
  };
  
  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    
    // Clear the file input
    const fileInput = document.getElementById('receipt') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const onSubmit = async (data: any) => {
    if (!user || !id) return;
    
    try {
      setIsUploading(true);
      
      // Upload receipt if provided
      let receiptUrl = selectedExpense?.receipt_url || null;
      if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile, user.id);
        if (!receiptUrl) {
          throw new Error('Failed to upload receipt');
        }
      }
      
      // Update expense
      await updateExpense(id, {
        ...data,
        user_id: user.id,
        receipt_url: receiptUrl,
        // Only include recurring_frequency if is_recurring is true
        recurring_frequency: data.is_recurring ? data.recurring_frequency : null,
        // Only include client_id if is_billable is true
        client_id: data.is_billable ? data.client_id : null,
        // Only include employee fields if is_salary is true
        employee_id: data.is_salary ? data.employee_id : null,
        salary_type: data.is_salary ? data.salary_type : null,
        hours_worked: (data.is_salary && data.salary_type === 'hourly') ? data.hours_worked : null,
        is_salary: data.is_salary
      });
      
      toast.success('Expense updated successfully');
      navigate('/expenses');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update expense');
    } finally {
      setIsUploading(false);
    }
  };
  
  if (loading && !selectedExpense) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/expenses')}
          className="text-gray-500 hover:text-gray-700 mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">Edit Expense</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="date"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.date ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('date', { required: 'Date is required' })}
                    />
                  </div>
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <div className="relative flex">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="amount"
                      step="0.01"
                      min="0"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder=""
                      {...register('amount', { 
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Amount must be greater than 0' },
                        valueAsNumber: true
                      })}
                    />
                    <select
                      className="block w-24 border-l-0 border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      {...register('currency')}
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    id="description"
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Office supplies, Software subscription"
                    {...register('description', { required: 'Description is required' })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="category_id"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.category_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('category_id', { required: 'Category is required' })}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Manage categories
                  </button>
                </div>
                
                <div>
                  <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    id="payment_method"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('payment_method')}
                  >
                    <option value="">Select payment method</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Additional Details */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Additional Details</h2>
              
              <div className="space-y-4">
                {/* Receipt Upload */}
                <div>
                  <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt (optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {receiptPreview ? (
                        <div className="relative">
                          <img 
                            src={receiptPreview} 
                            alt="Receipt preview" 
                            className="mx-auto h-32 object-contain"
                          />
                          <button
                            type="button"
                            onClick={clearReceipt}
                            className="absolute top-0 right-0 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : receiptFile ? (
                        <div className="relative">
                          <div className="flex items-center justify-center">
                            <FileText className="h-10 w-10 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">{receiptFile.name}</p>
                          <button
                            type="button"
                            onClick={clearReceipt}
                            className="absolute top-0 right-0 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="receipt"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                            >
                              <span>Upload a file</span>
                              <input
                                id="receipt"
                                name="receipt"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png,image/gif,application/pdf"
                                onChange={handleReceiptChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 5MB
                          </p>
                          <div className="flex justify-center">
                            <Upload className="h-10 w-10 text-gray-300" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                    placeholder="Add any additional details about this expense"
                    {...register('notes')}
                  ></textarea>
                </div>
                
                {/* Checkboxes */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_recurring"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        {...register('is_recurring')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_recurring" className="font-medium text-gray-700">Recurring expense</label>
                      <p className="text-gray-500">This expense occurs regularly</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_billable"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        {...register('is_billable')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_billable" className="font-medium text-gray-700">Billable to client</label>
                      <p className="text-gray-500">Charge this expense to a client</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_reimbursable"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        {...register('is_reimbursable')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_reimbursable" className="font-medium text-gray-700">Reimbursable</label>
                      <p className="text-gray-500">This expense will be reimbursed</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_salary"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        {...register('is_salary')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_salary" className="font-medium text-gray-700">Employee Salary</label>
                      <p className="text-gray-500">This expense is a salary payment to an employee</p>
                    </div>
                  </div>
                </div>
                
                {/* Conditional fields based on checkboxes */}
                {watchIsRecurring && (
                  <div>
                    <label htmlFor="recurring_frequency" className="block text-sm font-medium text-gray-700 mb-1">
                      Recurring Frequency
                    </label>
                    <select
                      id="recurring_frequency"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      {...register('recurring_frequency', { 
                        required: watchIsRecurring ? 'Frequency is required for recurring expenses' : false 
                      })}
                    >
                      <option value="">Select frequency</option>
                      {RECURRING_FREQUENCIES.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                    {errors.recurring_frequency && (
                      <p className="mt-1 text-sm text-red-600">{errors.recurring_frequency.message}</p>
                    )}
                  </div>
                )}
                
                {watchIsBillable && (
                  <div>
                    <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Client
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="client_id"
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.client_id ? 'border-red-300' : 'border-gray-300'
                        }`}
                        {...register('client_id', { 
                          required: watchIsBillable ? 'Client is required for billable expenses' : false 
                        })}
                      >
                        <option value="">Select a client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.company_name ? `${client.name} (${client.company_name})` : client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.client_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
                    )}
                  </div>
                )}
                
                {watchIsReimbursable && (
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="reimbursed"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        {...register('reimbursed')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="reimbursed" className="font-medium text-gray-700">Already reimbursed</label>
                      <p className="text-gray-500">Mark if you've already been reimbursed for this expense</p>
                    </div>
                  </div>
                )}
                
                {/* Employee Salary Fields */}
                {watchIsSalary && (
                  <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700">Salary Details</h3>
                    
                    <div>
                      <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Employee
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          id="employee_id"
                          className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.employee_id ? 'border-red-300' : 'border-gray-300'
                          }`}
                          {...register('employee_id', { 
                            required: watchIsSalary ? 'Employee is required for salary expenses' : false 
                          })}
                        >
                          <option value="">Select an employee</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name} {employee.designation ? `(${employee.designation})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.employee_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>
                      )}
                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                        <Link to="/employees/new" className="text-blue-600 hover:text-blue-800 flex items-center">
                          <Plus className="h-3 w-3 mr-1" /> Add new employee
                        </Link>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="salary_type" className="block text-sm font-medium text-gray-700 mb-1">
                        Salary Type
                      </label>
                      <select
                        id="salary_type"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.salary_type ? 'border-red-300' : 'border-gray-300'
                        }`}
                        {...register('salary_type', { 
                          required: watchIsSalary ? 'Salary type is required' : false 
                        })}
                      >
                        <option value="">Select salary type</option>
                        {SALARY_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.salary_type && (
                        <p className="mt-1 text-sm text-red-600">{errors.salary_type.message}</p>
                      )}
                    </div>
                    
                    {watchSalaryType === 'hourly' && (
                      <div>
                        <label htmlFor="hours_worked" className="block text-sm font-medium text-gray-700 mb-1">
                          Hours Worked
                        </label>
                        <input
                          type="number"
                          id="hours_worked"
                          min="0"
                          step="0.5"
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.hours_worked ? 'border-red-300' : 'border-gray-300'
                          }`}
                          {...register('hours_worked', { 
                            required: watchIsSalary && watchSalaryType === 'hourly' ? 'Hours worked is required' : false,
                            min: { value: 0.5, message: 'Hours worked must be at least 0.5' },
                            valueAsNumber: true
                          })}
                          onChange={handleHoursWorkedChange}
                        />
                        {errors.hours_worked && (
                          <p className="mt-1 text-sm text-red-600">{errors.hours_worked.message}</p>
                        )}
                      </div>
                    )}
                    
                    {watchIsSalary && watchIsBillable && (
                      <div className="bg-yellow-50 p-3 rounded-md">
                        <p className="text-sm text-yellow-700">
                          <strong>Note:</strong> This salary expense will be associated with the selected client.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/expenses')}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || isUploading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              >
                {(loading || isUploading) ? (
                  <span className="flex items-center justify-center">
                    <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    Saving...
                  </span>
                ) : (
                  'Update Expense'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
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
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {/* Implement the ExpenseCategoryForm component */}
                {/* This will be added in a separate implementation */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditExpense;