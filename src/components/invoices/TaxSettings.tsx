import { Percent } from 'lucide-react';
import { UseFormRegister, Controller, Control } from 'react-hook-form';
import { InvoiceFormData } from '../../types/invoice';

interface TaxSettingsProps {
  register: UseFormRegister<InvoiceFormData>;
  control: Control<InvoiceFormData>;
  updateTaxSettings: (taxPercentage: number, reverseCalculation: boolean) => void;
}

const TaxSettings: React.FC<TaxSettingsProps> = ({ 
  register, 
  control,
  updateTaxSettings 
}) => {
  return (
    <div className="p-4 sm:p-6 border-b border-gray-200">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Tax Settings</h2>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <label htmlFor="tax_percentage" className="block text-sm font-medium text-gray-700 mb-1">
            GST / Tax Rate (%)
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
                  placeholder="e.g., 18 for 18% GST"
                  value={field.value}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    field.onChange(value);
                    updateTaxSettings(value, document.getElementById('reverse_calculation')?.checked || false);
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
            Enter the applicable tax rate (e.g., 18 for 18% GST in India)
          </p>
        </div>
        
        <div className="flex items-center">
          <Controller
            name="reverse_calculation"
            control={control}
            render={({ field }) => (
              <input
                id="reverse_calculation"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={field.value}
                onChange={(e) => {
                  field.onChange(e.target.checked);
                  updateTaxSettings(
                    document.getElementById('tax_percentage')?.valueAsNumber || 0,
                    e.target.checked
                  );
                }}
              />
            )}
          />
          <label htmlFor="reverse_calculation" className="ml-2 block text-sm text-gray-700">
            Reverse tax calculation
          </label>
          <div className="ml-1 relative group">
            <div className="cursor-help text-gray-400 hover:text-gray-500">
              <span className="h-4 w-4 border border-gray-300 rounded-full inline-flex items-center justify-center text-xs font-semibold">?</span>
            </div>
            <div className="absolute z-10 left-0 transform -translate-x-1/2 mt-2 w-64 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              When checked, the invoice subtotal is treated as your target earnings. The system will add tax on top to calculate the final invoice amount your client pays.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSettings;