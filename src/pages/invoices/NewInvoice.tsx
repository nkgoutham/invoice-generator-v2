import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useClientStore } from '../../store/clientStore';
import { useProfileStore } from '../../store/profileStore';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateDueDate } from '../../utils/helpers';
import { EngagementModel, Client } from '../../lib/supabase';
import { InvoiceFormData, InvoicePreviewData } from '../../types/invoice';

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
import InvoicePreviewModal from '../../components/invoices/InvoicePreviewModal';

const NewInvoice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const watchReverseCalculation = watch('reverse_calculation');
  const watchNotes = watch('notes');
  
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
    let calculatedTax = 0;
    let calculatedTotal = 0;
    
    if (watchReverseCalculation) {
      // Reverse calculation (to get the desired net amount)
      // If we want the freelancer to receive exactly X amount
      // and the tax is Y%, then the invoice amount should be X/(1-Y/100)
      const taxFactor = 1 - (taxRate / 100);
      if (taxFactor > 0 && taxRate > 0) {
        calculatedTotal = calculatedSubtotal / taxFactor;
        calculatedTax = calculatedTotal - calculatedSubtotal;
      } else {
        calculatedTotal = calculatedSubtotal;
        calculatedTax = 0;
      }
    } else {
      // Forward calculation
      calculatedTax = calculatedSubtotal * (taxRate / 100);
      calculatedTotal = calculatedSubtotal + calculatedTax;
    }
    
    // Round to 2 decimal places for display consistency
    setSubtotal(Math.round(calculatedSubtotal * 100) / 100);
    setTax(Math.round(calculatedTax * 100) / 100);
    setTotal(Math.round(calculatedTotal * 100) / 100);
  }, [watchItems, watchEngagementType, watchMilestones, watchTaxPercentage, watchReverseCalculation]);
  
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
  }, [watchCurrency, selectedCurrency, watchEngagementType, watchTaxPercentage, watchReverseCalculation, calculateTotals]);
  
  // Watch items changes specifically to update amounts
  useEffect(() => {
    if (watchItems && watchItems.length > 0) {
      const updatedItems = watchItems.map((item, index) => {
        if (item) {
          const quantity = parseFloat(item.quantity?.toString() || '0') || 0;
          const rate = parseFloat(item.rate?.toString() || '0') || 0;
          const calculatedAmount = quantity * rate;
          
          if (calculatedAmount !== parseFloat(item.amount?.toString() || '0')) {
            setTimeout(() => {
              setValue(`items.${index}.amount`, calculatedAmount);
              calculateTotals();
            }, 0);
          }
        }
        return item;
      });
    }
  }, [watchItems, setValue, calculateTotals]);
  
  // Watch milestones specifically to update totals
  useEffect(() => {
    if (watchEngagementType === 'milestone' && watchMilestones && watchMilestones.length > 0) {
      calculateTotals();
    }
  }, [watchMilestones, watchEngagementType, calculateTotals]);
  
  // Generate invoice number on load
  useEffect(() => {
    if (user) {
      const setupForm = async () => {
        const invoiceNumber = await generateInvoiceNumber(user.id);
        setValue('invoice_number', invoiceNumber);
      };
      
      setupForm();
      fetchClients(user.id);
      fetchProfile(user.id);
      fetchBankingInfo(user.id);
    }
  }, [user, generateInvoiceNumber, setValue, fetchClients, fetchProfile, fetchBankingInfo]);
  
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
  
  // Prepare preview data when opening the preview modal
  const preparePreviewData = (): InvoicePreviewData => {
    return {
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
  
  const handleSave = async () => {
    if (!user) return;
    
    try {
      // Ensure we have the latest calculations
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
      
      // Prepare invoice items - this will depend on the engagement type
      let invoiceItems = [];
      
      if (formValues.engagement_type === 'milestone' && formValues.milestones) {
        // For milestone-based, create an item for each milestone
        invoiceItems = formValues.milestones.map(milestone => ({
          description: milestone.name,
          quantity: 1,
          rate: parseFloat(milestone.amount?.toString() || '0'),
          amount: parseFloat(milestone.amount?.toString() || '0'),
          milestone_name: milestone.name
        }));
      } else {
        // For other types, use the items from the form
        invoiceItems = formValues.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }));
      }
      
      // Create invoice
      const result = await createInvoice(invoiceData, invoiceItems);
      
      if (result) {
        toast.success('Invoice created successfully');
        navigate(`/invoices/${result.id}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };
  
  const onSubmit = handleSave;
  
  const addItem = () => {
    append({ description: '', quantity: 1, rate: 0, amount: 0 });
    
    // Calculate totals after adding item
    setTimeout(() => calculateTotals(), 0);
  };
  
  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      
      // Calculate totals after removing item
      setTimeout(() => calculateTotals(), 0);
    } else {
      toast.error('Invoice must have at least one item');
    }
  };
  
  const addMilestone = () => {
    appendMilestone({ name: `Milestone ${milestoneFields.length + 1}`, amount: 0 });
    
    // Calculate totals after adding milestone
    setTimeout(() => calculateTotals(), 0);
  };
  
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
    if (watchEngagementType === 'milestone') {
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
    } else if (watchEngagementType === 'retainership') {
      return (
        <RetainershipItem
          register={register}
          control={control}
          watchCurrency={watchCurrency}
          watchItems={watchItems}
          updateRetainershipAmount={updateRetainershipAmount}
        />
      );
    } else if (watchEngagementType === 'project') {
      return (
        <ProjectItem
          register={register}
          control={control}
          watchCurrency={watchCurrency}
          watchItems={watchItems}
          updateProjectAmount={updateProjectAmount}
        />
      );
    } else {
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
            onClick={() => navigate('/invoices')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          {/* Invoice Header */}
          <InvoiceHeader
            register={register}
            errors={errors}
            clients={clients}
            clientEngagementModel={clientEngagementModel}
            watchClientId={watchClientId}
          />
          
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
      
      {/* Invoice Preview Modal */}
      {previewOpen && previewData && (
        <InvoicePreviewModal
          isOpen={previewOpen}
          onClose={handleClosePreview}
          data={previewData}
          onSave={handleSaveFromPreview}
          isSaving={isSavingFromPreview || loading}
        />
      )}
    </div>
  );
};

export default NewInvoice;