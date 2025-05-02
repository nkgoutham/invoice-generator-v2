import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useProfileStore } from '../../store/profileStore';
import {
  ArrowLeft,
  Printer,
  Download,
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
  CheckCircle,
  Briefcase,
  Eye,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { formatCurrency, formatDate, engagementTypes } from '../../utils/helpers';
import RecordPaymentModal from '../../components/invoices/RecordPaymentModal';

const InvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    selectedInvoice, 
    invoiceItems, 
    fetchInvoice, 
    fetchInvoiceItems, 
    updateInvoiceStatus, 
    deleteInvoice, 
    loading,
    recordPayment
  } = useInvoiceStore();
  
  const { profile, fetchProfile } = useProfileStore();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

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
    }
  }, [id, fetchInvoice, fetchInvoiceItems]);
  
  useEffect(() => {
    if (selectedInvoice) {
      fetchProfile(selectedInvoice.user_id);
    }
  }, [selectedInvoice, fetchProfile]);
  
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
  
  const handleRecordPayment = async (paymentData: any) => {
    if (!id) return;

    try {
      await recordPayment(id, paymentData);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      // Refresh the invoice data
      fetchInvoice(id);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
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
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-3 mb-6">
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
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
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
                  <span className="ml-2 font-medium">{formatDate(selectedInvoice.issue_date)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Due Date:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedInvoice.due_date)}</span>
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
                  <span className="ml-2 font-medium">{formatDate(selectedInvoice.payment_date)}</span>
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
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoiceItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(item.rate, selectedInvoice.currency)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(item.amount, selectedInvoice.currency)}
                      </td>
                    </tr>
                  ))}
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
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Tax:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total:</span>
                  <span className="text-base font-medium text-blue-600">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                </div>
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
        
        <div className="p-4 sm:p-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/invoices/${id}/preview`}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              View Invoice
            </Link>
            
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => {
                toast.error('Download functionality not implemented yet');
              }}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </button>
            
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                toast.error('Email functionality not implemented yet');
              }}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Send to Client
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Show Record Payment button for sent, overdue, or partially_paid invoices */}
            {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue' || selectedInvoice.status === 'partially_paid') && (
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCardIcon className="mr-1.5 h-4 w-4" />
                {selectedInvoice.status === 'partially_paid' ? 'Update Payment' : 'Record Payment'}
              </button>
            )}
            
            {selectedInvoice.status === 'draft' && (
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => handleStatusChange('sent')}
              >
                <Send className="mr-1.5 h-4 w-4" />
                Mark as Sent
              </button>
            )}
            
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => navigate(`/invoices/edit/${id}`)}
            >
              <Edit className="mr-1.5 h-4 w-4" />
              Edit
            </button>
            
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Payment Recording Modal */}
      <RecordPaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSave={handleRecordPayment}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default InvoiceDetails;