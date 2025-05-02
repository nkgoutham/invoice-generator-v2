import { UseFormRegister, Control, Controller } from 'react-hook-form';
import { InvoiceFormData } from '../../types/invoice';

interface RetainershipItemProps {
  register: UseFormRegister<InvoiceFormData>;
  control: Control<InvoiceFormData>;
  watchCurrency: string;
  watchItems: any[];
  updateRetainershipAmount: (amount: number) => void;
}

const RetainershipItem: React.FC<RetainershipItemProps> = ({
  register,
  control,
  watchCurrency,
  updateRetainershipAmount
}) => {
  const currencySymbol = watchCurrency === 'USD' ? '$' : '₹';

  return (
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Retainer Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="retainer_period" className="block text-sm font-medium text-gray-700 mb-1">
            Billing Period
          </label>
          <input
            type="text"
            id="retainer_period"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., May 2025"
            {...register('retainer_period')}
          />
        </div>
        
        <div>
          <label htmlFor="items.0.rate" className="block text-sm font-medium text-gray-700 mb-1">
            Retainer Amount
          </label>
          <div className="flex">
            <div className="flex items-center justify-center bg-gray-100 px-3 border border-r-0 border-gray-300 rounded-l-md">
              {currencySymbol}
            </div>
            <Controller
              name="items.0.rate"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  id="items.0.rate"
                  className="block w-full border-gray-300 rounded-r-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  min="0"
                  step="0.01"
                  value={field.value}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    field.onChange(value);
                    updateRetainershipAmount(value);
                  }}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
          <input type="hidden" {...register('items.0.quantity')} value="1" />
        </div>
        
        <div className="col-span-2">
          <label htmlFor="items.0.description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            id="items.0.description"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            {...register('items.0.description', { required: 'Description is required' })}
          />
        </div>
      </div>
    </div>
  );
};

export default RetainershipItem;