import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash, FilePlus, Building, Phone, Mail, MapPin, CreditCard, Briefcase, Receipt } from 'lucide-react';
import { useClientStore } from '../../store/clientStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useAuthStore } from '../../store/authStore';
import { EngagementModel } from '../../lib/supabase';
import { formatCurrency } from '../../utils/helpers';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { getClient, deleteClient, fetchEngagementModel, loading } = useClientStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  
  const [client, setClient] = useState<any>(null);
  const [engagementModel, setEngagementModel] = useState<EngagementModel | null>(null);
  const [clientExpenses, setClientExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      const fetchClient = async () => {
        const data = await getClient(id);
        if (data) {
          setClient(data);
        }
      };
      fetchClient();
    }
  }, [id, getClient]);

  useEffect(() => {
    if (user) {
      fetchExpenses(user.id);
    }
  }, [user, fetchExpenses]);
  
  // Filter expenses for this client
  useEffect(() => {
    if (id && expenses.length > 0) {
      const filteredExpenses = expenses.filter(expense => expense.client_id === id);
      setClientExpenses(filteredExpenses);
    }
  }, [id, expenses]);
  
  useEffect(() => {
    if (id) {
      const fetchEngagement = async () => {
        try {
          await fetchEngagementModel(id);
          // The engagement model is stored in the store, access it directly
          const model = await useClientStore.getState().engagementModel;
          setEngagementModel(model);
        } catch (error) {
          console.error("Error fetching engagement model:", error);
        }
      };
      fetchEngagement();
    }
  }, [id, fetchEngagementModel]);

  if (loading || !client) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getEngagementTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'retainership': return 'Retainership';
      case 'project': return 'Project Based';
      case 'milestone': return 'Milestone Based';
      case 'service': return 'Service Based';
      default: return 'Not Set';
    }
  };

  const getEngagementStatusLabel = (status: string | undefined) => {
    if (!status) return 'Not Set';
    
    switch (status) {
      case 'onboarding': return 'New';
      case 'active': return 'Active';
      case 'project': return 'Project-based';
      case 'retainer': return 'Retainer';
      case 'completed': return 'Completed';
      case 'inactive': return 'Inactive';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link to="/clients" className="text-gray-500 hover:text-gray-700 mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">{client.name}</h1>
        </div>
        
        {/* Action buttons with improved mobile layout */}
        <div className="grid grid-cols-3 gap-2">
          <Link
            to={`/clients/${id}/edit`}
            className="flex flex-col items-center justify-center py-2 px-1 sm:py-3 sm:px-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-center shadow-sm"
          >
            <Pencil size={16} className="mb-1" />
            <span className="text-xs font-medium">Edit</span>
          </Link>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this client?')) {
                deleteClient(id!);
                navigate('/clients');
              }
            }}
            className="flex flex-col items-center justify-center py-2 px-1 sm:py-3 sm:px-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-center shadow-sm"
          >
            <Trash size={16} className="mb-1" />
            <span className="text-xs font-medium">Delete</span>
          </button>
          <Link
            to={`/invoices/new?client=${id}`}
            className="flex flex-col items-center justify-center py-2 px-1 sm:py-3 sm:px-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-center shadow-sm"
          >
            <FilePlus size={16} className="mb-1" />
            <span className="text-xs font-medium">New Invoice</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg font-semibold mb-4">Client Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-start space-x-3">
            <Building className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm text-gray-500">Company</p>
              <p className="font-medium">{client.company_name || 'Not specified'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Mail className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div className="overflow-hidden">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium truncate">{client.email || 'Not specified'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Phone className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{client.phone || 'Not specified'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm text-gray-500">Billing Address</p>
              <p className="font-medium break-words">{client.billing_address || 'Not specified'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CreditCard className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm text-gray-500">GST Number</p>
              <p className="font-medium">{client.gst_number || 'Not specified'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Briefcase className="text-gray-500 mt-1 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{getEngagementStatusLabel(client.engagement_status)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Model Information */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg font-semibold mb-4">Engagement Details</h2>
        {engagementModel ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Briefcase className="text-gray-500 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-gray-500">Engagement Type</p>
                <p className="font-medium">{getEngagementTypeLabel(engagementModel.type)}</p>
              </div>
            </div>

            {engagementModel.type === 'retainership' && engagementModel.retainer_amount && (
              <div className="flex items-start space-x-3">
                <CreditCard className="text-gray-500 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Monthly Retainer</p>
                  <p className="font-medium">{formatCurrency(engagementModel.retainer_amount)}</p>
                </div>
              </div>
            )}

            {engagementModel.type === 'project' && engagementModel.project_value && (
              <div className="flex items-start space-x-3">
                <CreditCard className="text-gray-500 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Project Value</p>
                  <p className="font-medium">{formatCurrency(engagementModel.project_value)}</p>
                </div>
              </div>
            )}

            {engagementModel.type === 'service' && engagementModel.service_rates && engagementModel.service_rates.length > 0 && (
              <div className="flex items-start space-x-3">
                <CreditCard className="text-gray-500 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Hourly Rate</p>
                  <p className="font-medium">{formatCurrency(engagementModel.service_rates[0].rate)} per {engagementModel.service_rates[0].unit}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No engagement details found
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
          </div>
          <div className="p-6 text-center">
            <div className="text-center py-6 sm:py-8 text-gray-500">
              No invoices found for this client
            </div>
            <Link
              to={`/invoices/new?client=${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Billable Expenses</h2>
              <Link
                to={`/expenses/new?client=${id}`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Receipt className="mr-1.5 h-3.5 w-3.5" />
                Add Expense
              </Link>
            </div>
          </div>
          
          {clientExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientExpenses.slice(0, 5).map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {clientExpenses.length > 5 && (
                <div className="px-6 py-3 bg-gray-50 text-center">
                  <Link
                    to={`/expenses?client=${id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all {clientExpenses.length} expenses
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No billable expenses</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add expenses that can be billed to this client.
              </p>
              <div className="mt-6">
                <Link
                  to={`/expenses/new?client=${id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Receipt className="mr-2 -ml-1 h-5 w-5" />
                  Add Billable Expense
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;