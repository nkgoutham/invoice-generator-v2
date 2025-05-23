import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useInvoiceStore, InvoiceHistory } from '../../store/invoiceStore';
import { useProfileStore } from '../../store/profileStore';
import { useExpenseStore } from '../../store/expenseStore';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Calendar,
  Building,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  CreditCard,
  Receipt,
  Plus,
  Briefcase, 
  Eye,
  CreditCard as CreditCardIcon,
  Clock,
  CheckCircle2,
  History
} from 'lucide-react';
import { formatCurrency, formatDate, engagementTypes } from '../../utils/helpers';
import RecordPaymentModal from '../../components/invoices/RecordPaymentModal';
import { InvoicePreviewData } from '../../types/invoice';
import { normalizeInvoiceData } from '../../utils/invoiceDataTransform';

const InvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const { 
    selectedInvoice, 
    invoiceItems, 
    invoiceHistory,
    fetchInvoice, 
    fetchInvoiceItems, 
    fetchInvoiceHistory,
    updateInvoiceStatus, 
    deleteInvoice, 
    loading,
    recordPayment
  } = useInvoiceStore();
  
  const { profile, fetchProfile } = useProfileStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [billableExpenses, setBillableExpenses] = useState<any[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (id) {
      fetchInvoice(id);
      fetchInvoiceItems(id);
      fetchInvoiceHistory(id);
      
      if (user) {
        fetchExpenses(user.id);
      }
    }
  }, [id, user, fetchInvoice, fetchInvoiceItems, fetchInvoiceHistory, fetchExpenses]);
  
  useEffect(() => {
    if (selectedInvoice) {
      fetchProfile(selectedInvoice.user_id);
    }
  }, [selectedInvoice, fetchProfile]);
  
  // Filter expenses associated with this invoice
  useEffect(() => {
    if (id && expenses.length > 0) {
      const filteredExpenses = expenses.filter(expense => 
        expense.invoice_id === id || 
        (expense.is_billable && expense.client_id === selectedInvoice?.client_id)
      );
      
      setBillableExpenses(filteredExpenses);
    }
  }, [id, expenses, selectedInvoice]);

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    
    try {
      await updateInvoiceStatus(id, status as any);
      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };
  
  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await deleteInvoice(id);
        toast.success('Invoice deleted successfully');
        navigate('/invoices');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
      }
    }
  };
  
  const handleRecordPayment = async (paymentDetails: any) => {
    if (!id) return;

    try {
      await recordPayment(id, paymentDetails);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      // Refresh the invoice data
      fetchInvoice(id);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };
  
  const handleSendInvoice = async () => {
    // @ts-ignore - client data is nested in the response
    const clientEmail = selectedInvoice?.clients?.email;
    
    if (!clientEmail) {
      toast.error('Client email address is missing');
      return;
    }

    try {
      // First mark as sent if it's a draft
      if (selectedInvoice?.status === 'draft') {
        await updateInvoiceStatus(id!, 'sent');
      }
      
      toast.success(`Invoice would be sent to ${clientEmail}`);
      // In a real implementation, you would call an API endpoint to send the email
      // Navigate back to invoices list after sending
      navigate('/invoices');
    } catch (error) {
      toast.error('Failed to update invoice status');
    }
  };

  const handleEdit = () => {
    navigate('/invoices/new', { 
      state: { 
        isEditing: true,
        invoice: {
          ...selectedInvoice,
          items: invoiceItems,
          milestones: selectedInvoice.engagement_type === 'milestone' ? 
            invoiceItems.map(item => ({ 
              name: item.description || item.milestone_name || '', 
              amount: item.amount 
            })) : undefined
        }
      } 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getEngagementTypeLabel = (type: string | undefined) => {
    if (!type) return '';
    const found = engagementTypes.find(t => t.value === type);
    return found ? found.label : '';
  };
  
  if (loading || !selectedInvoice) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // @ts-ignore - client data is nested in the response
  const client = selectedInvoice.clients || {};

  const getPaymentMethodLabel = (method: string | undefined) => {
    if (!method) return '';
    const methodMap: Record<string, string> = {
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash',
      'cheque': 'Cheque',
      'upi': 'UPI',
      'other': 'Other'
    };
    return methodMap[method] || method;
  };
  
  // Helper function to safely format dates
  const safeFormatDate = (dateValue: string | null | undefined) => {
    if (!dateValue) return '';
    
    try {
      return formatDate(dateValue);
    } catch (error) {
      console.error('Invalid date value:', dateValue, error);
      return '';
    }
  };
  
  // Find the payment recorded history entry to display exchange rate or INR amount
  const paymentHistoryEntry = invoiceHistory.find(entry => 
    entry.action === 'payment_recorded' && 
    (entry.details?.exchange_rate || entry.details?.inr_amount)
  );
  
  const showExchangeRateInfo = selectedInvoice.currency === 'USD' && 
    (paymentHistoryEntry?.details?.exchange_rate || paymentHistoryEntry?.details?.inr_amount);
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-3 mb-4 sm:mb-6">
        <div className="flex items-center">
          <Link
            to="/invoices"
            className="mr-3 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Invoice {selectedInvoice.invoice_number}</h1>
        </div>
        
        <div className="flex space-x-2 self-end sm:self-auto">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedInvoice.status)}`}>
            {selectedInvoice.status === 'partially_paid' ? 'Partially Paid' : 
              selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-4 sm:mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invoice Information</h2>
              
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex items-center text-sm">
                  <FileText className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Invoice Number:</span>
                  <span className="ml-2 font-medium">{selectedInvoice.invoice_number}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Issue Date:</span>
                  <span className="ml-2 font-medium">{safeFormatDate(selectedInvoice.issue_date)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Due Date:</span>
                  <span className="ml-2 font-medium">{safeFormatDate(selectedInvoice.due_date)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <DollarSign className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Currency:</span>
                  <span className="ml-2 font-medium">{selectedInvoice.currency || 'INR'}</span>
                </div>

                {selectedInvoice.engagement_type && (
                  <div className="flex items-center text-sm">
                    <Briefcase className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500">Engagement Type:</span>
                    <span className="ml-2 font-medium">{getEngagementTypeLabel(selectedInvoice.engagement_type)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Client Information</h2>
              
              <div className="mt-3 grid grid-cols-1 gap-y-2">
                <div className="flex items-start text-sm">
                  <User className="mr-2 h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500">Client:</span>
                    <span className="ml-2 font-medium">{client.name}</span>
                  </div>
                </div>
                
                {client.company_name && (
                  <div className="flex items-start text-sm">
                    <Building className="mr-2 h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500">Company:</span>
                      <span className="ml-2 font-medium">{client.company_name}</span>
                    </div>
                  </div>
                )}
                
                {client.email && (
                  <div className="flex items-start text-sm">
                    <Mail className="mr-2 h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium truncate block">{client.email}</span>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-start text-sm">
                    <Phone className="mr-2 h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-2 font-medium">{client.phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information Section - show if paid or partially paid */}
        {(selectedInvoice.status === 'paid' || selectedInvoice.status === 'partially_paid') && (
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-green-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedInvoice.payment_date && (
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-600">Payment Date:</span>
                  <span className="ml-2 font-medium">{safeFormatDate(selectedInvoice.payment_date)}</span>
                </div>
              )}

              {selectedInvoice.payment_method && (
                <div className="flex items-center text-sm">
                  <CreditCardIcon className="mr-2 h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="ml-2 font-medium">{getPaymentMethodLabel(selectedInvoice.payment_method)}</span>
                </div>
              )}

              {selectedInvoice.payment_reference && (
                <div className="flex items-center text-sm">
                  <FileText className="mr-2 h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-600">Reference:</span>
                  <span className="ml-2 font-medium">{selectedInvoice.payment_reference}</span>
                </div>
              )}

              {selectedInvoice.status === 'partially_paid' && selectedInvoice.partially_paid_amount !== undefined && (
                <div className="flex items-start text-sm">
                  <DollarSign className="mr-2 h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="ml-2 font-medium">{formatCurrency(selectedInvoice.partially_paid_amount, selectedInvoice.currency)}</span>
                    <span className="block text-gray-500 mt-0.5">
                      Balance: {formatCurrency(selectedInvoice.total - selectedInvoice.partially_paid_amount, selectedInvoice.currency)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Show exchange rate or INR amount for USD invoices */}
              {showExchangeRateInfo && (
                <div className="flex items-start text-sm col-span-1 sm:col-span-2 bg-blue-50 p-2 rounded">
                  <DollarSign className="mr-2 h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    {paymentHistoryEntry?.details?.exchange_rate && (
                      <div>
                        <span className="text-gray-600">Exchange Rate:</span>
                        <span className="ml-2 font-medium">
                          ₹{paymentHistoryEntry.details.exchange_rate.toFixed(2)} per USD
                        </span>
                      </div>
                    )}
                    {paymentHistoryEntry?.details?.inr_amount && (
                      <div>
                        <span className="text-gray-600">INR Amount Received:</span>
                        <span className="ml-2 font-medium">₹{paymentHistoryEntry.details.inr_amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h2>
          
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <div className="inline-block min-w-full align-middle px-4 sm:px-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedInvoice.engagement_type === 'milestone' ? (
                      <>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Milestone
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </>
                    ) : (
                      <>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoiceItems.length > 0 ? (
                    selectedInvoice.engagement_type === 'milestone' ? (
                      invoiceItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                            {item.description || item.milestone_name || 'Milestone'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-right text-sm text-gray-900 font-medium whitespace-nowrap">
                            {formatCurrency(item.amount, selectedInvoice.currency)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      invoiceItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-right text-sm text-gray-700 whitespace-nowrap">
                            {item.quantity}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-right text-sm text-gray-700 whitespace-nowrap">
                            {formatCurrency(item.rate, selectedInvoice.currency)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-right text-sm text-gray-900 font-medium whitespace-nowrap">
                            {formatCurrency(item.amount, selectedInvoice.currency)}
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    <tr>
                      <td 
                        colSpan={selectedInvoice.engagement_type === 'milestone' ? 2 : 4} 
                        className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No items found for this invoice
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex flex-col items-end">
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Subtotal:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                </div>
                
                {/* GST or Tax Section */}
                {selectedInvoice.is_gst_registered ? (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">GST ({selectedInvoice.gst_rate || 18}%):</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}</span>
                  </div>
                ) : selectedInvoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      {selectedInvoice.tax_name ? `${selectedInvoice.tax_name} (${selectedInvoice.tax_percentage}%)` : `Tax (${selectedInvoice.tax_percentage}%)`}:
                    </span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}</span>
                  </div>
                )}
                
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total:</span>
                  <span className="text-base font-medium text-blue-600">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                </div>
                
                {/* Partial Payment Details */}
                {selectedInvoice.status === 'partially_paid' && selectedInvoice.partially_paid_amount !== undefined && (
                  <>
                    <div className="pt-2 border-t border-gray-200 flex justify-between text-sm">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(selectedInvoice.partially_paid_amount, selectedInvoice.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining Balance:</span>
                      <span className="text-red-600 font-medium">
                        {formatCurrency(selectedInvoice.total - selectedInvoice.partially_paid_amount, selectedInvoice.currency)}
                      </span>
                    </div>
                  </>
                )}
                
                {/* TDS Section */}
                {selectedInvoice.is_tds_applicable && (
                  <>
                    <div className="flex justify-between text-red-600 pt-2">
                      <span className="text-sm font-medium">
                        TDS Deduction ({selectedInvoice.tds_rate || 10}%):
                      </span>
                      <span className="text-sm font-medium">
                        - {formatCurrency((selectedInvoice.subtotal * (selectedInvoice.tds_rate || 10)) / 100, selectedInvoice.currency)}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 flex justify-between">
                      <span className="text-base font-medium text-gray-900">Amount Payable:</span>
                      <span className="text-base font-medium text-green-600">
                        {formatCurrency(
                          selectedInvoice.total - (selectedInvoice.subtotal * (selectedInvoice.tds_rate || 10)) / 100,
                          selectedInvoice.currency
                        )}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1 italic">
                      * TDS will be deducted by client at the time of payment
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {selectedInvoice.notes && (
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
            <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
          </div>
        )}
        
        <div className="p-4 sm:p-6 flex flex-wrap gap-2">
          {/* This page is now only shown when user clicks Edit */}
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            onClick={handleEdit}
          >
            <Edit className="mr-1.5 h-4 w-4" />
            <span className="hidden xs:inline">Edit</span>
          </button>
          
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={handleDelete}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            <span className="hidden xs:inline">Delete</span>
          </button>
          
          <Link
            to={`/invoices/${id}/view`}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Eye className="mr-1.5 h-4 w-4" />
            <span className="hidden xs:inline">View Invoice</span>
          </Link>

          {/* Show Record/Update Payment button for sent, overdue, or partially paid invoices */}
          {(selectedInvoice.status === 'sent' || 
            selectedInvoice.status === 'overdue' || 
            selectedInvoice.status === 'partially_paid') && (
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => setShowPaymentModal(true)}
            >
              <CreditCardIcon className="mr-1.5 h-4 w-4" />
              <span className="hidden xs:inline">
                {selectedInvoice.status === 'partially_paid' ? 'Update Payment' : 'Record Payment'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSave={handleRecordPayment}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
};

export default InvoiceDetails;