import { UseFormRegister, Controller, Control } from 'react-hook-form';
import { InvoiceFormData } from '../../types/invoice';

interface ProjectItemProps {
  register: UseFormRegister<InvoiceFormData>;
  control: Control<InvoiceFormData>;
  watchCurrency: string;
  watchItems: any[];
  updateProjectAmount: (amount: number) => void;
}

const ProjectItem: React.FC<ProjectItemProps> = ({
  register,
  control,
  watchCurrency,
  updateProjectAmount
}) => {
  const currencySymbol = watchCurrency === 'USD' ? '$' : '₹';

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Project Details</h2>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="sm:col-span-2">
          <label htmlFor="project_description" className="block text-sm font-medium text-gray-700 mb-1">
            Project Description
          </label>
          <textarea
            id="project_description"
            rows={2}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
            placeholder="Brief description of the project"
            {...register('project_description')}
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="items.0.description" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Line Item
          </label>
          <input
            type="text"
            id="items.0.description"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            defaultValue="Project Fee"
            {...register('items.0.description', { required: 'Description is required' })}
          />
          <input type="hidden" {...register('items.0.quantity')} value="1" />
        </div>
        
        <div>
          <label htmlFor="items.0.rate" className="block text-sm font-medium text-gray-700 mb-1">
            Project Fee
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
                    // Always update project amount on rate change
                    updateProjectAmount(value);
                  }}
                  onBlur={(e) => {
                    // Also update on blur to catch any missed changes
                    field.onBlur();
                    const value = parseFloat(e.target.value) || 0;
                    updateProjectAmount(value);
                  }}
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectItem;