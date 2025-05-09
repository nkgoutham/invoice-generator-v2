import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useClientStore } from '../../store/clientStore';
import { useRecurringInvoiceStore } from '../../store/recurringInvoiceStore';
import { ArrowLeft, Calendar, Save } from 'lucide-react';
import toast from 'react-hot-toast';

// Import components
import ServiceItems from '../../components/invoices/ServiceItems';
import RetainershipItem from '../../components/invoices/RetainershipItem';
import ProjectItem from '../../components/invoices/ProjectItem';
import MilestoneItems from '../../components/invoices/MilestoneItems';
import TaxSettings from '../../components/invoices/TaxSettings';
import InvoiceTotals from '../../components/invoices/InvoiceTotals';
import InvoiceNotes from '../../components/invoices/InvoiceNotes';
import { RecurringInvoiceFormData, FREQUENCY_OPTIONS } from '../../types/invoice';
import { Client, EngagementModel } from '../../lib/supabase';

const NewRecurringInvoice = () => {
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { clients, fetchClients, fetchEngagementModel, getClient } = useClientStore();
  const { createRecurringInvoice, loading } = useRecurringInvoiceStore();
  
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [clientEngagementModel, setClientEngagementModel] = useState<EngagementModel | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const { 
    register, 
    control, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors } 
  } = useForm<RecurringInvoiceFormData>({
    defaultValues: {
      title: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      auto_send: false,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      currency: 'INR',
      tax_percentage: 0,
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      milestones: [{ name: 'Milestone 1', amount: 0 }]
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });
  
  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestoneField } = useFieldArray({
    control,
    name: 'milestones'
  });
  
  const watchItems = watch('items');
  const watchClientId = watch('client_id');
  const watchCurrency = watch('currency');
  const watchEngagementType = watch('engagement_type');
  const watchMilestones = watch('milestones', []);
  const watchTaxPercentage = watch('tax_percentage');
  
  // Calculate invoice totals based on all form fields
  const calculateTotals = useCallback(() => {
    const items = watchItems || [];
    
    // Calculate subtotal based on engagement type
    let calculatedSubtotal = 0;
    
    if (watchEngagementType === 'milestone' && watchMilestones.length > 0) {
      // For milestone: sum of all milestone amounts
      calculatedSubtotal = watchMilestones.reduce((sum, milestone) => {
        const amount = parseFloat(milestone.amount?.toString() || '0') || 0;
        return sum + amount;
      }, 0);
    } else if ((watchEngagementType === 'retainership' || watchEngagementType === 'project') && items.length > 0) {
      // For retainership or project: use the single item amount
      const amount = parseFloat(items[0]?.amount?.toString() || '0') || 0;
      calculatedSubtotal = amount;
    } else {
      // For service or other types: sum of all line items
      calculatedSubtotal = items.reduce((sum, item) => {
        const amount = parseFloat(item.amount?.toString() || '0') || 0;
        return sum + amount;
      }, 0);
    }
    
    // Calculate tax and total
    const taxRate = parseFloat(watchTaxPercentage?.toString() || '0') || 0;
    const calculatedTax = calculatedSubtotal * (taxRate / 100);
    const calculatedTotal = calculatedSubtotal + calculatedTax;
    
    // Round to 2 decimal places for display consistency
    setSubtotal(Math.round(calculatedSubtotal * 100) / 100);
    setTax(Math.round(calculatedTax * 100) / 100);
    setTotal(Math.round(calculatedTotal * 100) / 100);
  }, [watchItems, watchEngagementType, watchMilestones, watchTaxPercentage]);
  
  // Update item amount when quantity or rate changes
  const updateItemAmount = useCallback((index: number, quantity: number, rate: number) => {
    const amount = quantity * rate;
    setValue(`items.${index}.amount`, amount);
    
    // Recalculate totals immediately after updating the amount
    setTimeout(() => calculateTotals(), 0);
  }, [setValue, calculateTotals]);
  
  // Update milestone amount
  const updateMilestoneAmount = useCallback((index: number, amount: number) => {
    setValue(`milestones.${index}.amount`, amount);
    
    // Recalculate totals immediately after updating the amount
    setTimeout(() => calculateTotals(), 0);
  }, [setValue, calculateTotals]);
  
  // Update retainership amount
  const updateRetainershipAmount = useCallback((amount: number) => {
    setValue('items.0.amount', amount);
    
    // Recalculate totals immediately after updating the amount
    setTimeout(() => calculateTotals(), 0);
  }, [setValue, calculateTotals]);
  
  // Update project amount
  const updateProjectAmount = useCallback((amount: number) => {
    setValue('items.0.amount', amount);
    
    // Recalculate totals immediately after updating the amount
    setTimeout(() => calculateTotals(), 0);
  }, [setValue, calculateTotals]);
  
  // Update tax settings
  const updateTaxSettings = useCallback((taxPercentage: number) => {
    // Recalculate totals immediately
    setTimeout(() => calculateTotals(), 0);
  }, [calculateTotals]);
  
  // Run calculations whenever any relevant field changes
  useEffect(() => {
    calculateTotals();
    
    // Update currency when changed
    if (watchCurrency !== selectedCurrency) {
      setSelectedCurrency(watchCurrency);
    }
  }, [watchCurrency, selectedCurrency, watchEngagementType, watchTaxPercentage, calculateTotals]);
  
  // Fetch clients on load
  useEffect(() => {
    if (user) {
      fetchClients(user.id);
    }
  }, [user, fetchClients]);
  
  // Fetch client details when client changes
  useEffect(() => {
    if (watchClientId) {
      const loadClientInfo = async () => {
        try {
          const client = await getClient(watchClientId);
          setSelectedClient(client);
          
          await fetchEngagementModel(watchClientId);
          const model = useClientStore.getState().engagementModel;
          setClientEngagementModel(model);
          
          if (model) {
            setValue('engagement_type', model.type);
            
            // Pre-populate fields based on engagement type
            if (model.type === 'retainership' && model.retainer_amount) {
              // Clear existing items and add a retainer item
              setValue('items', [{
                description: 'Monthly Retainer Fee',
                quantity: 1,
                rate: model.retainer_amount,
                amount: model.retainer_amount
              }]);
            } else if (model.type === 'project' && model.project_value) {
              // Clear existing items and add a project item
              setValue('items', [{
                description: 'Project Fee',
                quantity: 1,
                rate: model.project_value,
                amount: model.project_value
              }]);
            } else if (model.type === 'service' && model.service_rates && model.service_rates.length > 0) {
              // Keep existing items but set the default rate
              const defaultRate = model.service_rates[0].rate;
              const items = watchItems.map(item => ({
                ...item,
                rate: item.rate || defaultRate,
                amount: item.quantity * (item.rate || defaultRate)
              }));
              setValue('items', items);
            }
            
            // Calculate totals after setting values
            setTimeout(() => calculateTotals(), 0);
          } else {
            // Set default engagement type if no model exists
            setValue('engagement_type', 'service');
          }
        } catch (error) {
          console.error("Error fetching client details:", error);
          // Set default engagement type in case of error
          setValue('engagement_type', 'service');
        }
      };
      
      loadClientInfo();
    }
  }, [watchClientId, fetchEngagementModel, getClient, setValue, watchItems, calculateTotals]);
  
  // Update form fields when engagement type changes
  useEffect(() => {
    if (watchEngagementType) {
      // Reset fields based on new engagement type
      if (watchEngagementType === 'retainership') {
        if (watchItems.length === 0 || watchItems[0]?.description !== 'Monthly Retainer Fee') {
          const retainerAmount = clientEngagementModel?.retainer_amount || 0;
          setValue('items', [{
            description: 'Monthly Retainer Fee',
            quantity: 1,
            rate: retainerAmount,
            amount: retainerAmount
          }]);
        }
      } else if (watchEngagementType === 'project') {
        if (watchItems.length === 0 || watchItems[0]?.description !== 'Project Fee') {
          const projectValue = clientEngagementModel?.project_value || 0;
          setValue('items', [{
            description: 'Project Fee',
            quantity: 1,
            rate: projectValue,
            amount: projectValue
          }]);
        }
      } else if (watchEngagementType === 'milestone') {
        // Initialize milestones if empty
        if (!watchMilestones || watchMilestones.length === 0) {
          setValue('milestones', [{ name: 'Milestone 1', amount: 0 }]);
        }
      } else if (watchEngagementType === 'service') {
        // Keep existing items or initialize with one empty item
        if (watchItems.length === 0) {
          const defaultRate = clientEngagementModel?.service_rates?.[0]?.rate || 0;
          setValue('items', [{ 
            description: 'Professional Services', 
            quantity: 1, 
            rate: defaultRate, 
            amount: defaultRate 
          }]);
        }
      }
      
      // Calculate totals after changing the engagement type
      setTimeout(() => calculateTotals(), 0);
    }
  }, [watchEngagementType, setValue, clientEngagementModel, watchItems, watchMilestones, calculateTotals]);
  
  // Calculate due date based on issue date (for previewing purposes)
  useEffect(() => {
    const issueDate = watch('issue_date');
    if (issueDate) {
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 15); // Default to 15 days
      setValue('due_date', dueDate.toISOString().split('T')[0]);
    }
  }, [watch, setValue]);
  
  const onSubmit = async (data: RecurringInvoiceFormData) => {
    if (!user) return;
    if (!data.client_id) {
      toast.error('Please select a client');
      return;
    }
    
    // Validate title
    if (!data.title.trim()) {
      toast.error('Please provide a title for the recurring invoice');
      return;
    }
    
    try {
      // Ensure we have the latest calculations
      calculateTotals();
      
      // Create recurring invoice
      const result = await createRecurringInvoice(data, user.id, data.client_id);
      
      if (result) {
        toast.success('Recurring invoice created successfully');
        navigate(`/recurring/${result.id}`);
      }
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
      toast.error('Failed to create recurring invoice');
    }
  };
  
  // Add item function for service items
  const addItem = () => {
    append({ description: '', quantity: 1, rate: 0, amount: 0 });
    
    // Calculate totals after adding item
    setTimeout(() => calculateTotals(), 0);
  };
  
  // Remove item function for service items
  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      
      // Calculate totals after removing item
      setTimeout(() => calculateTotals(), 0);
    } else {
      toast.error('Invoice must have at least one item');
    }
  };
  
  // Add milestone function
  const addMilestone = () => {
    appendMilestone({ name: `Milestone ${milestoneFields.length + 1}`, amount: 0 });
    
    // Calculate totals after adding milestone
    setTimeout(() => calculateTotals(), 0);
  };
  
  // Remove milestone function
  const removeMilestone = (index: number) => {
    if (milestoneFields.length > 1) {
      removeMilestoneField(index);
      
      // Calculate totals after removing milestone
      setTimeout(() => calculateTotals(), 0);
    } else {
      toast.error('You must have at least one milestone');
    }
  };
  
  // Render different item sections based on engagement type
  const renderItemsSection = () => {
    switch (watchEngagementType) {
      case 'milestone':
        return (
          <MilestoneItems
            register={register}
            control={control}
            milestoneFields={milestoneFields}
            watchCurrency={watchCurrency}
            milestonesFieldArray={{ fields: milestoneFields, append: appendMilestone, remove: removeMilestoneField }}
            addMilestone={addMilestone}
            removeMilestone={removeMilestone}
            updateMilestoneAmount={updateMilestoneAmount}
          />
        );
      case 'retainership':
        return (
          <RetainershipItem
            register={register}
            control={control}
            watchCurrency={watchCurrency}
            watchItems={watchItems}
            updateRetainershipAmount={updateRetainershipAmount}
          />
        );
      case 'project':
        return (
          <ProjectItem
            register={register}
            control={control}
            watchCurrency={watchCurrency}
            watchItems={watchItems}
            updateProjectAmount={updateProjectAmount}
          />
        );
      case 'service':
      default:
        // Default service-based or others: line items with quantity and rate
        return (
          <ServiceItems
            register={register}
            control={control}
            errors={errors}
            fields={fields}
            watchItems={watchItems}
            selectedCurrency={selectedCurrency}
            itemsFieldArray={{ fields, append, remove }}
            addItem={addItem}
            removeItem={removeItem}
            updateItemAmount={updateItemAmount}
          />
        );
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/recurring')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Recurring Invoice</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          {/* Recurring Invoice Details */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recurring Invoice Details</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {/* Title */}
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Monthly Website Maintenance"
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              
              {/* Client Selection */}
              <div>
                <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <select
                  id="client_id"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.client_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  {...register('client_id', { required: 'Client is required' })}
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.company_name ? `${client.name} (${client.company_name})` : client.name}
                    </option>
                  ))}
                </select>
                {errors.client_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
                )}
              </div>
              
              {/* Frequency */}
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <select
                  id="frequency"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('frequency', { required: 'Frequency is required' })}
                >
                  {FREQUENCY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Start Date */}
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="start_date"
                    className={`block w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.start_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    {...register('start_date', { required: 'Start date is required' })}
                  />
                </div>
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>
              
              {/* End Date (Optional) */}
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="end_date"
                    className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('end_date')}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank for no end date (continuous billing)
                </p>
              </div>
              
              {/* Auto-send Option */}
              <div className="flex items-center">
                <input
                  id="auto_send"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('auto_send')}
                />
                <label htmlFor="auto_send" className="ml-2 block text-sm text-gray-700">
                  Automatically send invoices to client
                </label>
              </div>
            </div>
          </div>
          
          {/* Currency Selection */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Template</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <select
                  id="currency"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.currency ? 'border-red-300' : 'border-gray-300'
                  }`}
                  {...register('currency', { required: 'Currency is required' })}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
              
              {/* Engagement Type */}
              <div>
                <label htmlFor="engagement_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Engagement Type
                </label>
                <select
                  id="engagement_type"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300`}
                  {...register('engagement_type')}
                >
                  <option value="">Select engagement type</option>
                  <option value="retainership">Retainership</option>
                  <option value="project">Project Based</option>
                  <option value="milestone">Milestone Based</option>
                  <option value="service">Service Based</option>
                </select>
                {clientEngagementModel && (
                  <p className="mt-1 text-xs text-gray-500">
                    Client's default: {clientEngagementModel.type.charAt(0).toUpperCase() + clientEngagementModel.type.slice(1)}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Dynamic Item Sections */}
          {renderItemsSection()}
          
          {/* Tax Settings */}
          <TaxSettings 
            register={register} 
            control={control}
            updateTaxSettings={updateTaxSettings}
          />
          
          {/* Invoice Totals */}
          <InvoiceTotals
            subtotal={subtotal}
            tax={tax}
            total={total}
            selectedCurrency={selectedCurrency}
            taxPercentage={watchTaxPercentage}
          />
          
          {/* Notes */}
          <InvoiceNotes register={register} />
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 mb-8">
          <button
            type="button"
            onClick={() => navigate('/recurring')}
            className="btn btn-secondary btn-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-md group"
          >
            <Save className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            {loading ? (
              <span className="flex items-center">
                <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                Saving...
              </span>
            ) : (
              'Save Recurring Invoice'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRecurringInvoice;