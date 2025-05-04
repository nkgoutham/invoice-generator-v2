import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useClientStore } from '../../store/clientStore';
import { ArrowLeft } from 'lucide-react';
import { engagementTypes } from '../../utils/helpers';

const EditClient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClient, updateClient, fetchEngagementModel, updateEngagementModel, loading } = useClientStore();
  
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    billing_address: '',
    gst_number: '',
    contact_person: '',
    email: '',
    phone: '',
    status: 'active',
    engagement_status: 'active' // Changed default from 'onboarding' to 'active'
  });

  const [engagementData, setEngagementData] = useState({
    type: 'service',
    retainer_amount: '',
    project_value: '',
    service_rates: [{ name: 'Hourly Rate', rate: 0, unit: 'hour', currency: 'INR' }]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);
  
  // Load client data
  useEffect(() => {
    const loadClient = async () => {
      if (id) {
        try {
          const clientData = await getClient(id);
          if (clientData) {
            setFormData({
              name: clientData.name || '',
              company_name: clientData.company_name || '',
              billing_address: clientData.billing_address || '',
              gst_number: clientData.gst_number || '',
              contact_person: clientData.contact_person || '',
              email: clientData.email || '',
              phone: clientData.phone || '',
              status: clientData.status || 'active',
              engagement_status: clientData.engagement_status || 'active'
            });
            setClientLoaded(true);
          }
        } catch (error) {
          console.error("Error loading client:", error);
          toast.error("Failed to load client data");
        }
      }
    };
    
    loadClient();
  }, [id, getClient]);
  
  // Load engagement model
  useEffect(() => {
    const loadEngagementModel = async () => {
      if (id && clientLoaded) {
        try {
          await fetchEngagementModel(id);
          const model = useClientStore.getState().engagementModel;
          
          if (model) {
            setEngagementData({
              type: model.type || 'service',
              retainer_amount: model.retainer_amount ? String(model.retainer_amount) : '',
              project_value: model.project_value ? String(model.project_value) : '',
              service_rates: model.service_rates && model.service_rates.length > 0 
                ? model.service_rates.map(rate => ({
                    ...rate, 
                    currency: rate.currency || 'INR'
                  }))
                : [{ name: 'Hourly Rate', rate: 0, unit: 'hour', currency: 'INR' }]
            });
            
            // Update engagement status based on model type
            if (model.type === 'retainership') {
              setFormData(prev => ({ ...prev, engagement_status: 'retainer' }));
            } else if (model.type === 'project') {
              setFormData(prev => ({ ...prev, engagement_status: 'project' }));
            }
          }
        } catch (error) {
          console.error("Error loading engagement model:", error);
        }
      }
    };
    
    loadEngagementModel();
  }, [id, fetchEngagementModel, clientLoaded]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEngagementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setEngagementData(prev => ({ ...prev, type }));
    
    // Update engagement status based on selected type
    if (type === 'retainership') {
      setFormData(prev => ({ ...prev, engagement_status: 'retainer' }));
    } else if (type === 'project') {
      setFormData(prev => ({ ...prev, engagement_status: 'project' }));
    } else {
      setFormData(prev => ({ ...prev, engagement_status: 'active' }));
    }
  };
  
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'retainer_amount' || name === 'project_value') {
      setEngagementData(prev => ({ ...prev, [name]: value }));
    } else if (name === 'hourly_rate') {
      // Update the first service rate
      const updatedRates = [...engagementData.service_rates];
      updatedRates[0] = { ...updatedRates[0], rate: parseFloat(value) || 0 };
      setEngagementData(prev => ({ ...prev, service_rates: updatedRates }));
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currency = e.target.value;
    const updatedRates = [...engagementData.service_rates];
    updatedRates[0] = { ...updatedRates[0], currency };
    setEngagementData(prev => ({ ...prev, service_rates: updatedRates }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Client name is required');
      return;
    }
    
    if (!id) {
      toast.error('Client ID is missing');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update client
      await updateClient(id, formData);
      
      // Update engagement model
      const model = useClientStore.getState().engagementModel;
      
      if (model) {
        // Update existing model
        const engagementModelData = {
          type: engagementData.type as 'retainership' | 'project' | 'milestone' | 'service',
          retainer_amount: engagementData.type === 'retainership' ? parseFloat(engagementData.retainer_amount) || null : null,
          project_value: engagementData.type === 'project' ? parseFloat(engagementData.project_value) || null : null,
          service_rates: engagementData.type === 'service' ? engagementData.service_rates : null
        };
        
        await updateEngagementModel(model.id, engagementModelData);
      } 
      
      toast.success('Client updated successfully');
      navigate(`/clients/${id}`);
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading && !clientLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/clients/${id}`)}
          className="text-gray-500 hover:text-gray-700 mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">Edit Client</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Client Information */}
            <div>
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Client Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="billing_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Address
                  </label>
                  <textarea
                    id="billing_address"
                    name="billing_address"
                    value={formData.billing_address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>
                
                <div>
                  <label htmlFor="gst_number" className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    id="gst_number"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Engagement Model Section */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Engagement Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="engagement_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Engagement Type *
                  </label>
                  <select
                    id="engagement_type"
                    name="engagement_type"
                    value={engagementData.type}
                    onChange={handleEngagementChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {engagementTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {engagementData.type === 'retainership' && (
                  <div>
                    <label htmlFor="retainer_amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Retainer Amount
                    </label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-gray-100 px-3 border border-r-0 border-gray-300 rounded-l-md">
                        ₹
                      </div>
                      <input
                        type="number"
                        id="retainer_amount"
                        name="retainer_amount"
                        value={engagementData.retainer_amount}
                        onChange={handleRateChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                )}

                {engagementData.type === 'project' && (
                  <div>
                    <label htmlFor="project_value" className="block text-sm font-medium text-gray-700 mb-1">
                      Project Value
                    </label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-gray-100 px-3 border border-r-0 border-gray-300 rounded-l-md">
                        ₹
                      </div>
                      <input
                        type="number"
                        id="project_value"
                        name="project_value"
                        value={engagementData.project_value}
                        onChange={handleRateChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                )}

                {engagementData.type === 'service' && (
                  <div>
                    <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex col-span-3">
                        <select
                          id="rate_currency"
                          className="flex items-center justify-center bg-gray-100 px-3 border border-r-0 border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={engagementData.service_rates[0].currency || 'INR'}
                          onChange={handleCurrencyChange}
                        >
                          <option value="INR">₹</option>
                          <option value="USD">$</option>
                        </select>
                        <input
                          type="number"
                          id="hourly_rate"
                          name="hourly_rate"
                          value={engagementData.service_rates[0].rate}
                          onChange={handleRateChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="text-gray-500 flex items-center text-sm">
                        per hour
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/clients/${id}`)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : 'Update Client'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClient;