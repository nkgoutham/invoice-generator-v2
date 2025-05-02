import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRecurringInvoiceStore } from '../../store/recurringInvoiceStore';
import { 
  ArrowLeft, 
  Calendar, 
  RefreshCw, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText 
} from 'lucide-react';
import { FREQUENCY_OPTIONS } from '../../types/invoice';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const RecurringInvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    selectedRecurringInvoice, 
    fetchRecurringInvoice, 
    toggleRecurringInvoiceStatus,
    deleteRecurringInvoice,
    loading 
  } = useRecurringInvoiceStore();
  
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRecurringInvoice(id);
    }
  }, [id, fetchRecurringInvoice]);
  
  const handleToggleStatus = async () => {
    if (!id || !selectedRecurringInvoice) return;
    
    try {
      const newStatus = selectedRecurringInvoice.status === 'active' ? 'inactive' : 'active';
      await toggleRecurringInvoiceStatus(id, newStatus);
      toast.success(`Recurring invoice ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update recurring invoice status');
    }
  };
  
  const handleDelete = async () => {
    if (!id || !selectedRecurringInvoice) return;
    
    if (window.confirm('Are you sure you want to delete this recurring invoice? This cannot be undone.')) {
      setIsDeleting(true);
      try {
        await deleteRecurringInvoice(id);
        toast.success('Recurring invoice deleted successfully');
        navigate('/recurring');
      } catch (error) {
        toast.error('Failed to delete recurring invoice');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const option = FREQUENCY_OPTIONS.find(opt => opt.value === frequency);
    return option ? option.label : frequency;
  };
  
  if (loading || !selectedRecurringInvoice) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // @ts-ignore
  const client = selectedRecurringInvoice.clients || {};
  const templateData = selectedRecurringInvoice.template_data;
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-3 mb-6">
        <div className="flex items-center">
          <Link
            to="/recurring"
            className="mr-3 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{selectedRecurringInvoice.title}</h1>
        </div>
        
        <div className="flex space-x-2 self-end sm:self-auto">
          <span
            className={`px-2.5 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
              selectedRecurringInvoice.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {selectedRecurringInvoice.status === 'active' ? (
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
            ) : (
              <XCircle className="h-3.5 w-3.5 mr-1" />
            )}
            {selectedRecurringInvoice.status.charAt(0).toUpperCase() + selectedRecurringInvoice.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recurring Invoice Information</h2>
              
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex items-center text-sm">
                  <RefreshCw className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Frequency:</span>
                  <span className="ml-2 font-medium">{getFrequencyLabel(selectedRecurringInvoice.frequency)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Start Date:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedRecurringInvoice.start_date)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Next Invoice:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedRecurringInvoice.next_issue_date)}</span>
                </div>
                
                {selectedRecurringInvoice.end_date && (
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500">End Date:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedRecurringInvoice.end_date)}</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm">
                  <FileText className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">Auto-send:</span>
                  <span className="ml-2 font-medium">{selectedRecurringInvoice.auto_send ? 'Yes' : 'No'}</span>
                </div>
                
                {selectedRecurringInvoice.last_generated && (
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500">Last Generated:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedRecurringInvoice.last_generated)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Client Information</h2>
              
              <div className="mt-3 grid grid-cols-1 gap-y-2">
                <div className="flex items-start text-sm">
                  <div>
                    <span className="text-gray-500">Client:</span>
                    <span className="ml-2 font-medium">{client.name}</span>
                  </div>
                </div>
                
                {client.company_name && (
                  <div className="flex items-start text-sm">
                    <div>
                      <span className="text-gray-500">Company:</span>
                      <span className="ml-2 font-medium">{client.company_name}</span>
                    </div>
                  </div>
                )}
                
                {client.email && (
                  <div className="flex items-start text-sm">
                    <div className="overflow-hidden">
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium truncate block">{client.email}</span>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-start text-sm">
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
        
        {/* Template Details */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Template Details</h2>
          
          <div className="mb-4 bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Engagement Type</p>
                <p className="mt-1 text-sm text-gray-900">
                  {templateData.invoice_data.engagement_type?.charAt(0).toUpperCase() + 
                    templateData.invoice_data.engagement_type?.slice(1) || 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Currency</p>
                <p className="mt-1 text-sm text-gray-900">
                  {templateData.invoice_data.currency || 'INR'}
                </p>
              </div>
              
              {templateData.invoice_data.tax_percentage && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tax Rate</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {templateData.invoice_data.tax_percentage}%
                  </p>
                </div>
              )}
              
              {templateData.invoice_data.notes && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {templateData.invoice_data.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Item Preview */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Invoice Items</h3>
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templateData.invoice_items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.description || item.milestone_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                        {templateData.invoice_data.currency === 'USD' ? '$' : '₹'}{item.rate}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {templateData.invoice_data.currency === 'USD' ? '$' : '₹'}{item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Schedule Information */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center mb-1">
                <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-900">Next Invoice</h3>
              </div>
              <p className="text-gray-500 text-sm">
                Will be generated on {formatDate(selectedRecurringInvoice.next_issue_date)}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center mb-1">
                <RefreshCw className="h-4 w-4 text-green-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-900">Frequency</h3>
              </div>
              <p className="text-gray-500 text-sm">
                Repeats {getFrequencyLabel(selectedRecurringInvoice.frequency)}
              </p>
            </div>
            
            {selectedRecurringInvoice.end_date ? (
              <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <div className="flex items-center mb-1">
                  <Calendar className="h-4 w-4 text-red-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">End Date</h3>
                </div>
                <p className="text-gray-500 text-sm">
                  Will end on {formatDate(selectedRecurringInvoice.end_date)}
                </p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <div className="flex items-center mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">No End Date</h3>
                </div>
                <p className="text-gray-500 text-sm">
                  Will continue until manually stopped
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                selectedRecurringInvoice.status === 'active'
                  ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                  : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
              }`}
            >
              {selectedRecurringInvoice.status === 'active' ? (
                <>
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  Activate
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate(`/recurring/edit/${id}`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="mr-1.5 h-4 w-4" />
              Edit
            </button>
            
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-1.5 rounded-full border-2 border-red-700/30 border-t-red-700 animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringInvoiceDetails;