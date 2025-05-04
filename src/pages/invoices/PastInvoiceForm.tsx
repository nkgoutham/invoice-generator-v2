import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useClientStore } from '../../store/clientStore';
import { useProfileStore } from '../../store/profileStore';
import { ArrowLeft, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateInvoiceTotals } from '../../utils/helpers';
import { EngagementModel, Client } from '../../lib/supabase';
import { InvoiceFormData, InvoicePreviewData } from '../../types/invoice';
import { normalizeInvoiceData } from '../../utils/invoiceDataTransform';

// Import components
import InvoiceHeader from '../../components/invoices/InvoiceHeader';
import ServiceItems from '../../components/invoices/ServiceItems';
import RetainershipItem from '../../components/invoices/RetainershipItem';
import ProjectItem from '../../components/invoices/ProjectItem';
import MilestoneItems from '../../components/invoices/MilestoneItems';
import TaxSettings from '../../components/invoices/TaxSettings';
import InvoiceTotals from '../../components/invoices/InvoiceTotals';
import InvoiceNotes from '../../components/invoices/InvoiceNotes';
import ActionButtons from '../../components/invoices/ActionButtons';

// Use lazy loading for the modal component
const InvoicePreviewModal = lazy(() => 
  import('../../components/invoices/InvoicePreviewModal')
);

const PastInvoiceForm = () => {
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { clients, fetchClients, fetchEngagementModel, getClient } = useClientStore();
  const { createInvoice, generateInvoiceNumber, loading } = useInvoiceStore();
  const { profile, bankingInfo, fetchProfile, fetchBankingInfo } = useProfileStore();
  
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [clientEngagementModel, setClientEngagementModel] = useState<EngagementModel | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<InvoicePreviewData | null>(null);
  const [isSavingFromPreview, setIsSavingFromPreview] = useState(false);
  
  // Initialize form with defaults for past invoice (including payment details)
  const { 
    register, 
    control, 
    handleSubmit, 
    setValue,
    watch,
    getValues,
    formState: { errors } 
  } = useForm<InvoiceFormData>({
    defaultValues: {
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0], // For past invoices, due date can default to issue date
      payment_date: new Date().toISOString().split('T')[0], // Default to today for payment date
      payment_method: 'bank_transfer',
      payment_reference: '',
      status: 'paid', // Default to paid for past invoices
      currency: 'INR',
      tax_percentage: 0,
      reverse_calculation: false,
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      milestones: [{ name: 'Milestone 1', amount: 0 }],
      engagement_type: 'service'
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
  const watchReverseCalculation = watch('reverse_calculation');
  const watchNotes = watch('notes');
  const watchPaymentDate = watch('payment_date');
  const watchPaymentMethod = watch('payment_method');
  
  // Calculate invoice totals based on engagement type
  const calculateTotals = useCallback(() => {
    try {
      const formData = getValues();
      const results = calculateInvoiceTotals(formData, watchEngagementType);
      
      // Update state with calculated values
      setSubtotal(results.subtotal);
      setTax(results.tax);
      setTotal(results.total);
    } catch (error) {
      console.error('Error calculating totals:', error);
      setSubtotal(0);
      setTax(0);
      setTotal(0);
    }
  }, [getValues, watchEngagementType]);
  
  // Update item amount when quantity or rate changes
  const updateItemAmount = useCallback((index: number, quantity: number, rate: number) => {
    const amount = quantity * rate;
    setValue(`items.${index}.amount`, amount);
    setTimeout(() => calculateTotals(), 0);
  }, [setValue, calculateTotals]);
  
  // Update milestone amount
  const updateMilestoneAmount = useCallback((index: number, amount: number) => {
    setValue(`milestones.${index}.amount`, amount);
    setTimeout(() => calculateTotals(), 0);
  }, [setValue, calculateTotals]);
  
  // Update retainership amount
  const updateRetainershipAmount = useCallback((amount: number) => {
    setValue('items.0.amount', amount);
    setTimeout(() => calculateTotals(), 0);
  }, [setValue, calculateTotals]);
  
  // Update project amount
  const updateProjectAmount = useCallback((amount: number) => {
    setValue('items.0.amount', amount);
    setValue('items.0.quantity', 1);
    setTimeout(() => calculateTotals(), 0);
  }, [setValue, calculateTotals]);
  
  // Update tax settings
  const updateTaxSettings = useCallback(() => {
    setTimeout(() => calculateTotals(), 0);
  }, [calculateTotals]);
  
  // Run calculations whenever any relevant field changes
  useEffect(() => {
    calculateTotals();
    
    // Update currency when changed
    if (watchCurrency !== selectedCurrency) {
      setSelectedCurrency(watchCurrency);
    }
  }, [watchCurrency, selectedCurrency, watchEngagementType, watchTaxPercentage, watchReverseCalculation, calculateTotals]);
  
  // Load initial data
  useEffect(() => {
    if (user) {
      // Generate invoice number
      generateInvoiceNumber(user.id).then((invoiceNumber) => {
        setValue('invoice_number', invoiceNumber);
      });
      
      // Load clients, profile, and banking info
      fetchClients(user.id);
      fetchProfile(user.id);
      fetchBankingInfo(user.id);
    }
  }, [user, generateInvoiceNumber, setValue, fetchClients, fetchProfile, fetchBankingInfo]);
  
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
              setValue('items', [{
                description: 'Monthly Retainer Fee',
                quantity: 1,
                rate: model.retainer_amount,
                amount: model.retainer_amount
              }]);
            } else if (model.type === 'project' && model.project_value) {
              setValue('items', [{
                description: 'Project Fee',
                quantity: 1,
                rate: model.project_value,
                amount: model.project_value
              }]);
            } else if (model.service_rates && model.service_rates.length > 0) {
              const defaultRate = model.service_rates[0].rate;
              setValue('items', [{
                description: 'Professional Services',
                quantity: 1,
                rate: defaultRate,
                amount: defaultRate
              }]);
            }
            
            // Calculate totals after setting values
            setTimeout(() => calculateTotals(), 0);
          }
        } catch (error) {
          console.error("Error fetching client details:", error);
        }
      };
      
      loadClientInfo();
    }
  }, [watchClientId, fetchEngagementModel, getClient, setValue, calculateTotals]);
  
  // Prepare preview data
  const preparePreviewData = (): InvoicePreviewData => {
    const data = {
      issuer: {
        business_name: profile?.business_name || 'Your Business',
        address: profile?.address || '',
        pan_number: profile?.pan_number,
        phone: profile?.phone,
        logo_url: profile?.logo_url || undefined,
        primary_color: profile?.primary_color,
        secondary_color: profile?.secondary_color,
        footer_text: profile?.footer_text
      },
      client: {
        name: selectedClient?.name || '',
        company_name: selectedClient?.company_name,
        billing_address: selectedClient?.billing_address,
        email: selectedClient?.email,
        phone: selectedClient?.phone,
        gst_number: selectedClient?.gst_number
      },
      banking: bankingInfo ? {
        account_holder: bankingInfo.account_holder,
        account_number: bankingInfo.account_number,
        ifsc_code: bankingInfo.ifsc_code,
        bank_name: bankingInfo.bank_name,
        branch: bankingInfo.branch
      } : undefined,
      invoice: {
        invoice_number: getValues('invoice_number'),
        issue_date: getValues('issue_date'),
        due_date: getValues('due_date'),
        subtotal: subtotal,
        tax: tax,
        total: total,
        notes: watchNotes,
        currency: watchCurrency,
        tax_percentage: watchTaxPercentage,
        engagement_type: watchEngagementType,
        items: watchEngagementType !== 'milestone' ? watchItems : undefined,
        milestones: watchEngagementType === 'milestone' ? watchMilestones : undefined,
        payment_date: watchPaymentDate,
        payment_method: watchPaymentMethod,
        payment_reference: getValues('payment_reference'),
        status: 'paid'
      }
    };
    
    return normalizeInvoiceData(data);
  };
  
  const handleOpenPreview = () => {
    setPreviewData(preparePreviewData());
    setPreviewOpen(true);
  };
  
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };
  
  const handleSaveFromPreview = async () => {
    setIsSavingFromPreview(true);
    await handleSave();
    setIsSavingFromPreview(false);
    setPreviewOpen(false);
  };
  
  // Save the invoice
  const handleSave = async (): Promise<string | undefined> => {
    if (!user) return;
    
    // Validate required fields
    if (!watchClientId) {
      toast.error("Please select a client");
      return;
    }
    
    if (!watchPaymentDate) {
      toast.error("Payment date is required for past invoices");
      return;
    }
    
    if (!watchPaymentMethod) {
      toast.error("Payment method is required for past invoices");
      return;
    }
    
    try {
      // Final calculation of totals to ensure accuracy
      calculateTotals();
      
      // Prepare invoice data
      const formValues = getValues();
      
      const invoiceData = {
        user_id: user.id,
        client_id: formValues.client_id,
        invoice_number: formValues.invoice_number,
        issue_date: formValues.issue_date,
        due_date: formValues.due_date,
        status: 'paid', // Always mark as paid for past invoices
        subtotal,
        tax,
        total,
        notes: formValues.notes,
        currency: formValues.currency,
        engagement_type: formValues.engagement_type,
        tax_percentage: formValues.tax_percentage,
        reverse_calculation: formValues.reverse_calculation,
        payment_date: formValues.payment_date,
        payment_method: formValues.payment_method,
        payment_reference: formValues.payment_reference
      };
      
      // Prepare invoice items based on engagement type
      let invoiceItems = [];
      
      if (formValues.engagement_type === 'milestone' && formValues.milestones) {
        invoiceItems = formValues.milestones.map(milestone => ({
          description: null,
          quantity: 1,
          rate: parseFloat(milestone.amount?.toString() || '0'),
          amount: parseFloat(milestone.amount?.toString() || '0'),
          milestone_name: milestone.name
        }));
      } else if (formValues.engagement_type === 'project' || formValues.engagement_type === 'retainership') {
        invoiceItems = [{
          description: formValues.items[0].description || (formValues.engagement_type === 'project' ? 'Project Fee' : 'Monthly Retainer Fee'),
          quantity: 1,
          rate: parseFloat(formValues.items[0].rate?.toString() || '0'),
          amount: parseFloat(formValues.items[0].amount?.toString() || subtotal)
        }];
      } else {
        invoiceItems = formValues.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount || (item.quantity * item.rate)
        }));
      }
      
      // Create invoice
      const result = await createInvoice(invoiceData, invoiceItems);
      
      if (result) {
        toast.success('Past invoice recorded successfully');
        navigate(`/invoices/${result.id}`);
        return result.id;
      }
    } catch (error) {
      console.error('Error creating past invoice:', error);
      toast.error('Failed to record past invoice');
    }
  };
  
  const onSubmit = handleSave;
  
  // Add item function for service items
  const addItem = () => {
    append({ description: '', quantity: 1, rate: 0, amount: 0 });
    setTimeout(() => calculateTotals(), 0);
  };
  
  // Remove item function for service items
  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      setTimeout(() => calculateTotals(), 0);
    } else {
      toast.error('Invoice must have at least one item');
    }
  };
  
  // Add milestone function
  const addMilestone = () => {
    appendMilestone({ name: `Milestone ${milestoneFields.length + 1}`, amount: 0 });
    setTimeout(() => calculateTotals(), 0);
  };
  
  // Remove milestone function
  const removeMilestone = (index: number) => {
    if (milestoneFields.length > 1) {
      removeMilestoneField(index);
      setTimeout(() => calculateTotals(), 0);
    } else {
      toast.error('You must have at least one milestone');
    }
  };
  
  // Render different item sections based on engagement type
  const renderEngagementTypeForm = () => {
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
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Record Past Invoice
          </h1>
        </div>
      </div>
      
      {/* Alert banner for past invoice */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              You're recording a past invoice that has already been paid. This invoice will automatically be marked as paid.
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4 sm:mb-6">
          {/* Invoice Header */}
          <InvoiceHeader
            register={register}
            errors={errors}
            clients={clients}
            clientEngagementModel={clientEngagementModel}
            watchClientId={watchClientId}
          />
          
          {/* Payment Details - Required for past invoices */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-green-50">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Payment Details</h2>
            <p className="text-sm text-gray-600 mb-4">
              These details are required for past invoices that have already been paid.
            </p>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <div>
                <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  id="payment_date"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                    errors.payment_date ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  {...register('payment_date', { required: "Payment date is required for past invoices" })}
                />
                {errors.payment_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.payment_date.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  id="payment_method"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                    errors.payment_method ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  {...register('payment_method', { required: "Payment method is required for past invoices" })}
                >
                  <option value="">Select payment method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                  <option value="other">Other</option>
                </select>
                {errors.payment_method && (
                  <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
                )}
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="payment_reference" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference
                </label>
                <input
                  type="text"
                  id="payment_reference"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Transaction ID, Cheque number, etc."
                  {...register('payment_reference')}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Item Sections */}
          {renderEngagementTypeForm()}
          
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
            reverseCalculation={watchReverseCalculation}
          />
          
          {/* Notes */}
          <InvoiceNotes register={register} />
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 mb-8">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="w-full sm:w-auto btn btn-secondary btn-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto btn btn-primary btn-md"
          >
            {loading ? 'Saving...' : 'Save Past Invoice'}
          </button>
          <button
            type="button"
            onClick={handleOpenPreview}
            className="w-full sm:w-auto btn btn-success btn-md"
          >
            Preview Invoice
          </button>
        </div>
      </form>
      
      {/* Invoice Preview Modal (lazy loaded) */}
      {previewOpen && previewData && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>}>
          <InvoicePreviewModal
            isOpen={previewOpen}
            onClose={handleClosePreview}
            data={previewData}
            onSave={handleSaveFromPreview}
            isSaving={isSavingFromPreview || loading}
            isUpdate={false}
          />
        </Suspense>
      )}
    </div>
  );
};

export default PastInvoiceForm;