import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useClientStore } from '../../store/clientStore';
import { useProfileStore } from '../../store/profileStore';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateDueDate, calculateInvoiceTotals } from '../../utils/helpers';
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

// Use lazy loading for the modal component which is not needed immediately
const InvoicePreviewModal = lazy(() => 
  import('../../components/invoices/InvoicePreviewModal')
);

const NewInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const editMode = location.state?.isEditing;
  const existingInvoice = location.state?.invoice;
  const preselectedClientId = searchParams.get('client');
  
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
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
      due_date: calculateDueDate(new Date().toISOString(), 15),
      currency: 'INR',
      tax_percentage: 0,
      reverse_calculation: false,
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      milestones: [{ name: 'Milestone 1', amount: 0 }],
      engagement_type: 'service' // Set a default engagement type
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
      // Fallback to zero values in case of calculation error
      setSubtotal(0);
      setTax(0);
      setTotal(0);
    }
  }, [getValues, watchEngagementType]);
  
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
    setValue('items.0.quantity', 1);
    
    // Recalculate totals immediately after updating the amount
    setTimeout(() => calculateTotals(), 0);
  }, [setValue, calculateTotals]);
  
  // Update tax settings
  const updateTaxSettings = useCallback(() => {
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
  }, [
    watchCurrency, 
    selectedCurrency, 
    watchEngagementType, 
    watchTaxPercentage, 
    watchReverseCalculation, 
    calculateTotals
  ]);
  
  // Watch items changes specifically to update amounts
  useEffect(() => {
    if (watchItems && watchItems.length > 0) {
      let updateNeeded = false;
      
      const updatedItems = watchItems.map((item, index) => {
        if (item) {
          const quantity = parseFloat(item.quantity?.toString() || '0') || 0;
          const rate = parseFloat(item.rate?.toString() || '0') || 0;
          const currentAmount = parseFloat(item.amount?.toString() || '0') || 0;
          const calculatedAmount = quantity * rate;
          
          // Check if we need to update the amount
          if (Math.abs(calculatedAmount - currentAmount) > 0.001) { // Using an epsilon for float comparison
            updateNeeded = true;
            
            // Update this specific item
            setTimeout(() => {
              setValue(`items.${index}.amount`, calculatedAmount);
            }, 0);
          }
        }
        return item;
      });
      
      // Only recalculate totals if any amounts were updated
      if (updateNeeded) {
        setTimeout(() => calculateTotals(), 10); // A slight delay to ensure all setValue operations have completed
      }
    }
  }, [watchItems, setValue, calculateTotals]);
  
  // Watch milestones specifically to update totals
  useEffect(() => {
    if (watchEngagementType === 'milestone' && watchMilestones && watchMilestones.length > 0) {
      calculateTotals();
    }
  }, [watchMilestones, watchEngagementType, calculateTotals]);
  
  // Initialize form on load
  useEffect(() => {
    if (user) {
      const setupForm = async () => {
        if (!editMode) {
          const invoiceNumber = await generateInvoiceNumber(user.id);
          setValue('invoice_number', invoiceNumber);
        }
      };
      
      setupForm();
      fetchClients(user.id);
      fetchProfile(user.id);
      fetchBankingInfo(user.id);
      
      // If in edit mode, populate form with existing invoice data
      if (editMode && existingInvoice) {
        setValue('client_id', existingInvoice.client_id);
        setValue('invoice_number', existingInvoice.invoice_number);
        setValue('issue_date', existingInvoice.issue_date);
        setValue('due_date', existingInvoice.due_date);
        setValue('notes', existingInvoice.notes);
        setValue('currency', existingInvoice.currency);
        setValue('engagement_type', existingInvoice.engagement_type);
        setValue('tax_percentage', existingInvoice.tax_percentage);
        setValue('reverse_calculation', existingInvoice.reverse_calculation);
        
        // Set items based on engagement type
        if (existingInvoice.engagement_type === 'milestone' && existingInvoice.milestones) {
          setValue('milestones', existingInvoice.milestones);
        } else if (existingInvoice.items) {
          setValue('items', existingInvoice.items);
          
          // For retainership, set the retainer period if available
          if (existingInvoice.engagement_type === 'retainership' && existingInvoice.retainer_period) {
            setValue('retainer_period', existingInvoice.retainer_period);
          }
          
          // For project, set the project description if available
          if (existingInvoice.engagement_type === 'project' && existingInvoice.project_description) {
            setValue('project_description', existingInvoice.project_description);
          }
        }
      }
    }
  }, [user, generateInvoiceNumber, setValue, fetchClients, fetchProfile, fetchBankingInfo, editMode, existingInvoice]);
  
  // Set preselected client if available
  useEffect(() => {
    if (preselectedClientId) {
      setValue('client_id', preselectedClientId);
    }
  }, [preselectedClientId, setValue]);
  
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
            // We store the client's engagement model but do NOT force it as the selected type
            // Instead, we'll use it as a suggestion and pre-populate data for the user
            
            // Only set engagement_type if it hasn't been set yet (like on initial client selection)
            const currentEngagementType = getValues('engagement_type');
            if (!currentEngagementType || currentEngagementType === '') {
              setValue('engagement_type', model.type);
            }
            
            // Pre-populate fields based on the current engagement type (not the client's default)
            const selectedEngagementType = getValues('engagement_type');
            
            if (selectedEngagementType === 'retainership' && model.retainer_amount) {
              // Only set retainer item if items are empty or if we just switched to this type
              if (watchItems.length === 0 || watchItems[0]?.description === '' || watchItems[0]?.rate === 0) {
                setValue('items', [{
                  description: 'Monthly Retainer Fee',
                  quantity: 1,
                  rate: model.retainer_amount,
                  amount: model.retainer_amount
                }]);
              }
            } else if (selectedEngagementType === 'project' && model.project_value) {
              // Only set project item if items are empty or if we just switched to this type
              if (watchItems.length === 0 || watchItems[0]?.description === '' || watchItems[0]?.rate === 0) {
                setValue('items', [{
                  description: 'Project Fee',
                  quantity: 1,
                  rate: model.project_value,
                  amount: model.project_value
                }]);
              }
            } else if (selectedEngagementType === 'service' && model.service_rates && model.service_rates.length > 0) {
              // If service type - get default rate from engagement model
              const defaultRate = model.service_rates[0].rate;
              
              // Only update rates if they're 0 or empty to avoid overriding user input
              if (watchItems.some(item => !item.rate)) {
                const items = watchItems.map(item => ({
                  ...item,
                  rate: item.rate || defaultRate,
                  amount: item.quantity * (item.rate || defaultRate)
                }));
                setValue('items', items);
              }
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
  }, [watchClientId, fetchEngagementModel, getClient, setValue, getValues, watchItems, calculateTotals]);
  
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
  
  // Prepare preview data when opening the preview modal
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
        milestones: watchEngagementType === 'milestone' ? watchMilestones : undefined
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

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      // Save the invoice first if it's not already saved
      const savedInvoiceId = await handleSave();
      
      // For now, we'll just show a toast message since we haven't implemented the actual email sending
      if (selectedClient?.email) {
        toast.success(`Invoice would be sent to ${selectedClient.email}`);
        // In a real implementation, you would call an API endpoint to send the email
      } else {
        toast.error('Client email address is missing');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  // Main save function
  const handleSave = async (): Promise<string | undefined> => {
    if (!user) return;
    
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
        status: 'draft',
        subtotal,
        tax,
        total,
        notes: formValues.notes,
        currency: formValues.currency,
        engagement_type: formValues.engagement_type,
        tax_percentage: formValues.tax_percentage,
        reverse_calculation: formValues.reverse_calculation
      };
      
      // Prepare invoice items based on engagement type
      let invoiceItems = [];
      
      if (formValues.engagement_type === 'milestone' && formValues.milestones) {
        // For milestone-based, create an item for each milestone
        invoiceItems = formValues.milestones.map(milestone => ({
          description: null, // Not needed for milestones
          quantity: 1,
          rate: parseFloat(milestone.amount?.toString() || '0'),
          amount: parseFloat(milestone.amount?.toString() || '0'),
          milestone_name: milestone.name
        }));
      } else if (formValues.engagement_type === 'project' || formValues.engagement_type === 'retainership') {
        // For project or retainership, use the single item
        invoiceItems = [{
          description: formValues.items[0].description || (formValues.engagement_type === 'project' ? 'Project Fee' : 'Monthly Retainer Fee'),
          quantity: 1,
          rate: parseFloat(formValues.items[0].rate?.toString() || '0'),
          amount: parseFloat(formValues.items[0].amount?.toString() || subtotal)
        }];
      } else {
        // For service-based or other types, use all line items
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
        toast.success('Invoice created successfully');
        return result.id;
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };
  
  const onSubmit = handleSave;
  
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
            {editMode ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
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
        <ActionButtons 
          loading={loading} 
          onCancel={() => navigate('/invoices')}
          onPreview={handleOpenPreview}
        />
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
            onSend={handleSendEmail}
            isSaving={isSavingFromPreview || loading}
            isUpdate={editMode}
          />
        </Suspense>
      )}
    </div>
  );
};

export default NewInvoice;