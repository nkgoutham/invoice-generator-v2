import { useState, useEffect } from 'react';
import { Percent, Info, AlertCircle } from 'lucide-react';
import { UseFormRegister, Controller, Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { InvoiceFormData } from '../../types/invoice';

interface TaxSettingsProps {
  register: UseFormRegister<InvoiceFormData>;
  control: Control<InvoiceFormData>;
  watch: UseFormWatch<InvoiceFormData>;
  setValue: UseFormSetValue<InvoiceFormData>;
  updateTaxSettings: (taxPercentage: number, taxName?: string) => void;
}

const TaxSettings: React.FC<TaxSettingsProps> = ({ 
  register, 
  control,
  watch,
  setValue,
  updateTaxSettings 
}) => {
  const watchTaxName = watch('tax_name');
  const watchTaxPercentage = watch('tax_percentage');
  const watchIsGstRegistered = watch('is_gst_registered');
  const watchGstRate = watch('gst_rate');
  const watchIsTdsApplicable = watch('is_tds_applicable');
  const watchTdsRate = watch('tds_rate');
  const watchCurrency = watch('currency');
  const watchItems = watch('items');
  const watchMilestones = watch('milestones');
  
  const [autoTdsEnabled, setAutoTdsEnabled] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  
  // Calculate current subtotal to determine if TDS should be auto-enabled
  useEffect(() => {
    try {
      let calculatedSubtotal = 0;
      
      // Calculate subtotal from items
      if (watchItems && watchItems.length > 0) {
        calculatedSubtotal = watchItems.reduce((sum, item) => {
          return sum + (Number(item.amount) || 0);
        }, 0);
      } 
      // Or calculate from milestones
      else if (watchMilestones && watchMilestones.length > 0) {
        calculatedSubtotal = watchMilestones.reduce((sum, milestone) => {
          return sum + (Number(milestone.amount) || 0);
        }, 0);
      }
      
      setSubtotal(calculatedSubtotal);
      
      // Auto-enable TDS for INR invoices > ₹30,000
      if (watchCurrency === 'INR' && calculatedSubtotal > 30000) {
        if (watchIsTdsApplicable === undefined || watchIsTdsApplicable === null) {
          setValue('is_tds_applicable', true);
          
          // Only set default TDS rate if it's not already set
          if (!watchTdsRate) {
            setValue('tds_rate', 10);
          }
          
          setAutoTdsEnabled(true);
        }
      } else if (autoTdsEnabled && (watchCurrency !== 'INR' || calculatedSubtotal <= 30000)) {
        // Don't automatically disable TDS if the user manually enabled it
        if (watchIsTdsApplicable === undefined || watchIsTdsApplicable === null) {
          setAutoTdsEnabled(false);
        }
      }
    } catch (error) {
      console.error('Error in TDS auto-enable logic:', error);
    }
  }, [watchItems, watchMilestones, watchCurrency, watchIsTdsApplicable, setValue, watchTdsRate, autoTdsEnabled]);

  // Update tax settings when any tax-related field changes
  const handleTaxChange = () => {
    updateTaxSettings(
      parseFloat(watchTaxPercentage?.toString() || '0') || 0,
      watchTaxName?.toString() || ''
    );
  };

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Tax Settings</h2>
      
      <div className="space-y-6">
        {/* GST Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-start mb-4">
            <div className="flex items-center h-5">
              <input
                id="is_gst_registered"
                type="checkbox"
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                {...register('is_gst_registered')}
                onChange={(e) => {
                  register('is_gst_registered').onChange(e);
                  if (e.target.checked) {
                    setValue('gst_rate', 18); // Set default GST rate when enabled
                  }
                  handleTaxChange();
                }}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="is_gst_registered" className="font-medium text-gray-700">GST Registered</label>
              <p className="text-gray-500">Enable this if you are registered for GST and need to charge GST on invoices</p>
            </div>
          </div>
          
          {watchIsGstRegistered && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mt-4">
              <div>
                <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  id="gstin"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  {...register('gstin')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your GST Identification Number
                </p>
              </div>
              
              <div>
                <label htmlFor="gst_rate" className="block text-sm font-medium text-gray-700 mb-1">
                  GST Rate (%)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <Controller
                    name="gst_rate"
                    control={control}
                    defaultValue={18}
                    render={({ field }) => (
                      <input
                        type="number"
                        id="gst_rate"
                        min="0"
                        max="100"
                        step="0.01"
                        className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g., 18 for 18%"
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          field.onChange(value);
                          handleTaxChange();
                        }}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Percent className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Standard GST rate is 18%
                </p>
              </div>
            </div>
          )}
          
          {!watchIsGstRegistered && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mt-4">
              <div>
                <label htmlFor="tax_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Type (Optional)
                </label>
                <input
                  type="text"
                  id="tax_name"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Service Tax, VAT"
                  {...register('tax_name')}
                  onChange={(e) => {
                    register('tax_name').onChange(e);
                    handleTaxChange();
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the type of tax applied (leave blank if no tax)
                </p>
              </div>
              
              <div>
                <label htmlFor="tax_percentage" className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <Controller
                    name="tax_percentage"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        id="tax_percentage"
                        min="0"
                        max="100"
                        step="0.01"
                        className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g., 5 for 5%"
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          field.onChange(value);
                          handleTaxChange();
                        }}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Percent className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the applicable tax rate percentage
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* TDS Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-start mb-4">
            <div className="flex items-center h-5">
              <input
                id="is_tds_applicable"
                type="checkbox"
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                {...register('is_tds_applicable')}
                onChange={(e) => {
                  register('is_tds_applicable').onChange(e);
                  if (e.target.checked && !watchTdsRate) {
                    setValue('tds_rate', 10); // Set default TDS rate when enabled
                  }
                  handleTaxChange();
                }}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="is_tds_applicable" className="font-medium text-gray-700">
                TDS Applicable
                {autoTdsEnabled && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Auto-enabled
                  </span>
                )}
              </label>
              <p className="text-gray-500">
                {watchCurrency === 'INR' && subtotal > 30000
                  ? "Automatically enabled as amount exceeds ₹30,000" 
                  : "Enable if client will deduct TDS from payment (typically for amounts over ₹30,000)"}
              </p>
            </div>
          </div>
          
          {watchIsTdsApplicable && (
            <div className="mt-4">
              <label htmlFor="tds_rate" className="block text-sm font-medium text-gray-700 mb-1">
                TDS Rate (%)
              </label>
              <div className="relative rounded-md shadow-sm">
                <Controller
                  name="tds_rate"
                  control={control}
                  defaultValue={10}
                  render={({ field }) => (
                    <input
                      type="number"
                      id="tds_rate"
                      min="0"
                      max="100"
                      step="0.01"
                      className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., 10 for 10%"
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(value);
                        handleTaxChange();
                      }}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Percent className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Standard TDS rate is 10% for professional services
              </p>
            </div>
          )}
        </div>
        
        {/* Tax Information */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Tax Information</h3>
              <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc pl-5">
                <li>GST (18% standard rate) is added to your invoice subtotal</li>
                <li>TDS (10% standard rate) is deducted by the client from the payment</li>
                <li>TDS is calculated on the base amount (before GST)</li>
                {watchCurrency === 'INR' && (
                  <li>TDS is automatically enabled for invoices over ₹30,000</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSettings;