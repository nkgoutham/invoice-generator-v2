import { Trash2 } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFieldArrayReturn, Controller, Control } from 'react-hook-form';
import { InvoiceFormData } from '../../types/invoice';

interface ServiceItemsProps {
  register: UseFormRegister<InvoiceFormData>;
  control: Control<InvoiceFormData>;
  errors: FieldErrors<InvoiceFormData>;
  fields: any[];
  watchItems: any[];
  selectedCurrency: string;
  itemsFieldArray: UseFieldArrayReturn<InvoiceFormData, 'items', 'id'>;
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItemAmount: (index: number, quantity: number, rate: number) => void;
}

const ServiceItems: React.FC<ServiceItemsProps> = ({
  register,
  control,
  errors,
  fields,
  watchItems,
  selectedCurrency,
  addItem,
  removeItem,
  updateItemAmount
}) => {
  const currencySymbol = selectedCurrency === 'USD' ? '$' : '₹';

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base sm:text-lg font-medium text-gray-900">Invoice Items</h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center px-2 sm:px-3 py-1 border border-transparent text-xs sm:text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Item
          </button>
        </div>
      </div>
      
      {/* For small screens, display items as cards */}
      <div className="block sm:hidden space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-200 rounded-md p-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input
                  type="text"
                  className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.items?.[index]?.description ? 'border-red-300' : ''
                  }`}
                  placeholder="Item description"
                  {...register(`items.${index}.description` as const, {
                    required: 'Description is required'
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                  <Controller
                    name={`items.${index}.quantity` as const}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.items?.[index]?.quantity ? 'border-red-300' : ''
                        }`}
                        value={field.value || ''}
                        onChange={(e) => {
                          const quantity = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          field.onChange(quantity);
                          
                          const rate = parseFloat(watchItems[index]?.rate?.toString() || '0') || 0;
                          updateItemAmount(index, quantity, rate);
                        }}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rate</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {currencySymbol}
                    </div>
                    <Controller
                      name={`items.${index}.rate` as const}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`block w-full pl-8 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.items?.[index]?.rate ? 'border-red-300' : ''
                          }`}
                          value={field.value || ''}
                          onChange={(e) => {
                            const rate = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            field.onChange(rate);
                            
                            const quantity = parseFloat(watchItems[index]?.quantity?.toString() || '0') || 0;
                            updateItemAmount(index, quantity, rate);
                          }}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {currencySymbol}
                    </div>
                    <input
                      type="text"
                      readOnly
                      className="block w-full pl-8 bg-gray-50 border-gray-300 rounded-md shadow-sm text-gray-500 sm:text-sm cursor-not-allowed"
                      value={(parseFloat(watchItems[index]?.amount?.toString() || '0') || 0).toFixed(2)}
                      {...register(`items.${index}.amount` as const)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={fields.length <= 1}
                  className="text-red-600 hover:text-red-900 mt-5"
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* For larger screens, display items in a table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                Description
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Quantity
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Rate
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Amount
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fields.map((field, index) => {
              return (
                <tr key={field.id}>
                  <td className="px-4 py-4">
                    <input
                      type="text"
                      className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.items?.[index]?.description ? 'border-red-300' : ''
                      }`}
                      placeholder="Item description"
                      {...register(`items.${index}.description` as const, {
                        required: 'Description is required'
                      })}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Controller
                      name={`items.${index}.quantity` as const}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.items?.[index]?.quantity ? 'border-red-300' : ''
                          }`}
                          value={field.value || ''}
                          onChange={(e) => {
                            const quantity = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            field.onChange(quantity);
                            
                            const rate = parseFloat(watchItems[index]?.rate?.toString() || '0') || 0;
                            updateItemAmount(index, quantity, rate);
                          }}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {currencySymbol}
                      </div>
                      <Controller
                        name={`items.${index}.rate` as const}
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={`block w-full pl-8 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              errors.items?.[index]?.rate ? 'border-red-300' : ''
                            }`}
                            value={field.value || ''}
                            onChange={(e) => {
                              const rate = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              field.onChange(rate);
                              
                              const quantity = parseFloat(watchItems[index]?.quantity?.toString() || '0') || 0;
                              updateItemAmount(index, quantity, rate);
                            }}
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {currencySymbol}
                      </div>
                      <input
                        type="text"
                        readOnly
                        className="block w-full pl-8 bg-gray-50 border-gray-300 rounded-md shadow-sm text-gray-500 sm:text-sm cursor-not-allowed"
                        value={
                          (parseFloat(watchItems[index]?.amount?.toString() || '0') || 0).toFixed(2)
                        }
                        {...register(`items.${index}.amount` as const)}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-900"
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceItems;