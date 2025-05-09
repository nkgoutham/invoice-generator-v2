import { Percent } from 'lucide-react';
import { UseFormRegister, Controller, Control } from 'react-hook-form';
import { InvoiceFormData } from '../../types/invoice';

interface TaxSettingsProps {
  register: UseFormRegister<InvoiceFormData>;
  control: Control<InvoiceFormData>;
  updateTaxSettings: (taxPercentage: number) => void;
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
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    field.onChange(value);
                    updateTaxSettings(value);
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
      </div>
    </div>
  );
};

export default TaxSettings;