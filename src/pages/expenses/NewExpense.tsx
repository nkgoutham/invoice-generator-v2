import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore, ExpenseCategory } from '../../store/expenseStore';
import { useClientStore } from '../../store/clientStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { ArrowLeft, Upload, Calendar, DollarSign, Tag, Building, FileText, Trash2, Plus, FileInvoice } from 'lucide-react';
import toast from 'react-hot-toast';
import ExpenseCategoryForm from '../../components/expenses/ExpenseCategoryForm';

interface ExpenseFormData {
  date: string;
  amount: number;
  description: string;
  category_id: string;
  client_id?: string;
  invoice_id?: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  notes?: string;
  is_billable: boolean;
  is_reimbursable: boolean;
  reimbursed: boolean;
  payment_method?: string;
  currency: string;
}

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

const NewExpense = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createExpense, categories, fetchCategories, uploadReceipt, loading } = useExpenseStore();
  const { clients, fetchClients } = useClientStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const [searchParams] = useSearchParams();
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  
  // Get client_id and invoice_id from URL params if available
  const clientIdParam = searchParams.get('client');
  const invoiceIdParam = searchParams.get('invoice');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ExpenseFormData>({
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
  const watchClientId = watch('client_id');
  
  useEffect(() => {
    if (user) {
      fetchCategories(user.id);
      fetchClients(user.id);
      fetchInvoices(user.id);
    }
  }, [user, fetchCategories, fetchClients, fetchInvoices]);
  
  // Set client and invoice from URL params
  useEffect(() => {
    if (clientIdParam) {
      setValue('client_id', clientIdParam);
      setValue('is_billable', true);
    }
    
    if (invoiceIdParam) {
      setValue('invoice_id', invoiceIdParam);
      setValue('is_billable', true);
    }
  }, [clientIdParam, invoiceIdParam, setValue]);
  
  // Filter invoices by selected client
  const clientInvoices = invoices.filter(invoice => 
    watchClientId && invoice.client_id === watchClientId && 
    (invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'partially_paid')
  );
  
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
  
  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) return;
    
    try {
      setIsUploading(true);
      
      // Upload receipt if provided
      let receiptUrl = null;
      if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile, user.id);
        if (!receiptUrl) {
          throw new Error('Failed to upload receipt');
        }
      }
      
      // Create expense
      const expense = await createExpense({
        ...data,
        user_id: user.id,
        receipt_url: receiptUrl,
        // Only include recurring_frequency if is_recurring is true
        recurring_frequency: data.is_recurring ? data.recurring_frequency : null,
        // Only include client_id if is_billable is true
        client_id: data.is_billable ? data.client_id : null,
      });
      
      if (expense) {
        toast.success('Expense added successfully');
        navigate('/expenses');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add expense');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/expenses')}
          className="text-gray-500 hover:text-gray-700 mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">Add New Expense</h1>
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
                    <div className="flex">
                      <select
                        id="category_id"
                        className={`block w-full pl-10 pr-3 py-2 border rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
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
                      <button
                        type="button"
                        onClick={() => setShowCategoryForm(true)}
                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                  )}
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
                
                {/* Invoice selection - only show if client is selected */}
                {watchIsBillable && watchClientId && clientInvoices.length > 0 && (
                  <div>
                    <label htmlFor="invoice_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Associate with Invoice (optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileInvoice className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="invoice_id"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        {...register('invoice_id')}
                      >
                        <option value="">Select an invoice (optional)</option>
                        {clientInvoices.map((invoice) => (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.invoice_number} - {formatCurrency(invoice.total, invoice.currency)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Associating with an invoice helps with tracking billable expenses
                    </p>
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
                  'Save Expense'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCategoryForm(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowCategoryForm(false)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <ExpenseCategoryForm />
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowCategoryForm(false)}
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

export default NewExpense;