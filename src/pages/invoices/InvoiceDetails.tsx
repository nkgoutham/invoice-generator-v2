import { useEffect, useState, useRef } from 'react';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoicePreviewData } from '../../types/invoice';
import { normalizeInvoiceData } from '../../utils/invoiceDataTransform';

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [invoiceRef, setInvoiceRef] = useState<HTMLDivElement | null>(null);
  const [previewData, setPreviewData] = useState<InvoicePreviewData | null>(null);

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

  // Prepare preview data for PDF generation
  useEffect(() => {
    if (selectedInvoice && profile && invoiceItems) {
      // @ts-ignore - client data is nested in the response
      const client = selectedInvoice.clients || {};
      
      const data: Partial<InvoicePreviewData> = {
        issuer: {
          business_name: profile.business_name || 'Your Business',
          address: profile.address || '',
          pan_number: profile.pan_number,
          phone: profile.phone,
          logo_url: profile.logo_url,
          primary_color: profile.primary_color,
          secondary_color: profile.secondary_color,
          footer_text: profile.footer_text
        },
        client: {
          name: client.name || '',
          company_name: client.company_name,
          billing_address: client.billing_address,
          email: client.email,
          phone: client.phone,
          gst_number: client.gst_number
        },
        invoice: {
          invoice_number: selectedInvoice.invoice_number,
          issue_date: selectedInvoice.issue_date,
          due_date: selectedInvoice.due_date,
          subtotal: selectedInvoice.subtotal,
          tax: selectedInvoice.tax,
          total: selectedInvoice.total,
          notes: selectedInvoice.notes,
          currency: selectedInvoice.currency || 'INR',
          tax_percentage: selectedInvoice.tax_percentage || 0,
          engagement_type: selectedInvoice.engagement_type,
          status: selectedInvoice.status,
          payment_date: selectedInvoice.payment_date,
          payment_method: selectedInvoice.payment_method,
          payment_reference: selectedInvoice.payment_reference,
          is_partially_paid: selectedInvoice.is_partially_paid,
          partially_paid_amount: selectedInvoice.partially_paid_amount
        }
      };

      // Handle items based on engagement type
      if (selectedInvoice.engagement_type === 'milestone') {
        // For milestone-based, create milestone entries
        data.invoice!.milestones = invoiceItems.map(item => ({
          name: item.description || item.milestone_name || 'Milestone',
          amount: item.amount
        }));
      } else {
        // For other types, use the invoiceItems directly
        data.invoice!.items = invoiceItems;
      }

      // Normalize data to ensure all required fields are present
      setPreviewData(normalizeInvoiceData(data));
    }
  }, [selectedInvoice, profile, invoiceItems]);
  
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
      // Update the paymentDetails to include the status
      const updatedPaymentDetails = {
        ...paymentDetails,
        status: paymentDetails.is_partially_paid ? 'partially_paid' : 'paid'
      };

      await recordPayment(id, updatedPaymentDetails);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      // Refresh the invoice data
      fetchInvoice(id);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef) {
      toast.error('Cannot generate PDF at this time');
      return;
    }
    
    setIsPrinting(true);
    
    try {
      // Create a clone of the invoice element to apply PDF-specific styling without affecting the visible element
      const invoiceClone = invoiceRef.cloneNode(true) as HTMLElement;
      invoiceClone.classList.add('pdf-mode');
      
      // Temporarily append to the document but hide it
      invoiceClone.style.position = 'absolute';
      invoiceClone.style.left = '-9999px';
      invoiceClone.style.width = '1024px'; // Force desktop width
      document.body.appendChild(invoiceClone);
      
      const canvas = await html2canvas(invoiceClone, {
        scale: 1.5, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        windowWidth: 1200, // Force desktop-like rendering
        width: 1024 // Fixed width to ensure desktop layout
      });
      
      // Remove the clone after canvas generation
      document.body.removeChild(invoiceClone);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with compression
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable compression
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice-${selectedInvoice?.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSendInvoice = () => {
    // @ts-ignore - client data is nested in the response
    const clientEmail = selectedInvoice?.clients?.email;
    
    if (!clientEmail) {
      toast.error('Client email address is missing');
      return;
    }

    toast.success(`Invoice would be sent to ${clientEmail}`);
    // In a real implementation, you would call an API endpoint to send the email
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
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0" ref={(ref) => setInvoiceRef(ref)}>
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
        
        <div className="p-4 sm:p-6 flex flex-wrap gap-2">
          <Link
            to={`/invoices/${id}/preview`}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Eye className="mr-1.5 h-4 w-4" />
            <span className="hidden xs:inline">View Invoice</span>
          </Link>
          
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={handleDownloadPDF}
            disabled={isPrinting}
          >
            <Download className="mr-1.5 h-4 w-4" />
            <span className="hidden xs:inline">{isPrinting ? 'Generating...' : 'Download PDF'}</span>
          </button>
          
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleSendInvoice}
          >
            <Send className="mr-1.5 h-4 w-4" />
            <span className="hidden xs:inline">Send</span>
          </button>
          
          {/* Show Record Payment button for sent, overdue, or partially_paid invoices */}
          {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue' || selectedInvoice.status === 'partially_paid' || selectedInvoice.status === 'draft') && (
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => setShowPaymentModal(true)}
            >
              <CreditCardIcon className="mr-1.5 h-4 w-4" />
              <span className="hidden xs:inline">{selectedInvoice.status === 'partially_paid' ? 'Update Payment' : 'Record Payment'}</span>
            </button>
          )}
          
          {selectedInvoice.status === 'draft' && (
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => handleStatusChange('sent')}
            >
              <Send className="mr-1.5 h-4 w-4" />
              <span className="hidden xs:inline">Mark as Sent</span>
            </button>
          )}
          
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit className="mr-1.5 h-4 w-4" />
            <span className="hidden xs:inline">Edit</span>
          </button>
          
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={handleDelete}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            <span className="hidden xs:inline">Delete</span>
          </button>
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