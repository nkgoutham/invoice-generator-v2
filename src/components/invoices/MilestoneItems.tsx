import { Trash2 } from 'lucide-react';
import { UseFormRegister, UseFieldArrayReturn, Controller, Control } from 'react-hook-form';
import { InvoiceFormData } from '../../types/invoice';

interface MilestoneItemsProps {
  register: UseFormRegister<InvoiceFormData>;
  control: Control<InvoiceFormData>;
  milestoneFields: any[];
  watchCurrency: string;
  milestonesFieldArray: UseFieldArrayReturn<InvoiceFormData, 'milestones', 'id'>;
  addMilestone: () => void;
  removeMilestone: (index: number) => void;
  updateMilestoneAmount: (index: number, amount: number) => void;
}

const MilestoneItems: React.FC<MilestoneItemsProps> = ({
  register,
  control,
  milestoneFields,
  watchCurrency,
  addMilestone,
  removeMilestone,
  updateMilestoneAmount
}) => {
  const currencySymbol = watchCurrency === 'USD' ? '$' : '₹';
  
  return (
    <div className="p-4 sm:p-6 border-b border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Milestones</h2>
        <button
          type="button"
          onClick={addMilestone}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Milestone
        </button>
      </div>
      
      <div className="space-y-4">
        {milestoneFields.map((field, index) => (
          <div key={field.id} className="flex flex-col sm:flex-row items-start gap-3 p-4 border border-gray-200 rounded-md">
            <div className="flex-1 w-full">
              <label htmlFor={`milestones.${index}.name`} className="block text-sm font-medium text-gray-700 mb-1">
                Milestone Name
              </label>
              <input
                type="text"
                id={`milestones.${index}.name`}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register(`milestones.${index}.name` as const, { required: 'Milestone name is required' })}
              />
            </div>
            
            <div className="w-full sm:w-48">
              <label htmlFor={`milestones.${index}.amount`} className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="flex items-center">
                <div className="flex items-center justify-center bg-gray-100 px-3 border border-r-0 border-gray-300 rounded-l-md">
                  {currencySymbol}
                </div>
                <Controller
                  name={`milestones.${index}.amount` as const}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      id={`milestones.${index}.amount`}
                      className="block w-full border-gray-300 rounded-r-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      step="0.01"
                      min="0"
                      value={field.value}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                        updateMilestoneAmount(index, value);
                      }}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </div>
            </div>
            
            <div className="sm:pt-8 mt-2 sm:mt-0 self-center sm:self-start">
              <button
                type="button"
                onClick={() => removeMilestone(index)}
                className="text-red-600 hover:text-red-900"
                disabled={milestoneFields.length <= 1}
                aria-label="Remove milestone"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MilestoneItems;