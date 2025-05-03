import { Calendar } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Client } from '../../lib/supabase';
import { engagementTypes, currencyOptions } from '../../utils/helpers';
import { InvoiceFormData } from '../../types/invoice';

interface InvoiceHeaderProps {
  register: UseFormRegister<InvoiceFormData>;
  errors: FieldErrors<InvoiceFormData>;
  clients: Client[];
  clientEngagementModel: any | null;
  watchClientId: string;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  register,
  errors,
  clients,
  clientEngagementModel,
  watchClientId
}) => {
  return (
    <div className="p-4 sm:p-6 border-b border-gray-200">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Invoice Information</h2>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {/* Client Selection */}
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
            Client *
          </label>
          <select
            id="client_id"
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.client_id ? 'border-red-300' : 'border-gray-300'
            }`}
            {...register('client_id', { required: 'Client is required' })}
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.company_name ? `${client.name} (${client.company_name})` : client.name}
              </option>
            ))}
          </select>
          {errors.client_id && (
            <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
          )}
        </div>
        
        {/* Invoice Number */}
        <div>
          <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number *
          </label>
          <input
            type="text"
            id="invoice_number"
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.invoice_number ? 'border-red-300' : 'border-gray-300'
            }`}
            {...register('invoice_number', { required: 'Invoice number is required' })}
          />
          {errors.invoice_number && (
            <p className="mt-1 text-sm text-red-600">{errors.invoice_number.message}</p>
          )}
        </div>
        
        {/* Currency Selection */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency *
          </label>
          <select
            id="currency"
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.currency ? 'border-red-300' : 'border-gray-300'
            }`}
            {...register('currency', { required: 'Currency is required' })}
          >
            {currencyOptions.map(currency => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Engagement Type */}
        <div>
          <label htmlFor="engagement_type" className="block text-sm font-medium text-gray-700 mb-1">
            Engagement Type *
          </label>
          <select
            id="engagement_type"
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300`}
            {...register('engagement_type', { required: 'Engagement type is required' })}
          >
            {engagementTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {clientEngagementModel && (
            <p className="mt-1 text-xs text-gray-500">
              Client's default: {engagementTypes.find(t => t.value === clientEngagementModel.type)?.label}
            </p>
          )}
        </div>
        
        {/* Issue Date */}
        <div>
          <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Date *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="issue_date"
              className={`block w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.issue_date ? 'border-red-300' : 'border-gray-300'
              }`}
              {...register('issue_date', { required: 'Issue date is required' })}
            />
          </div>
          {errors.issue_date && (
            <p className="mt-1 text-sm text-red-600">{errors.issue_date.message}</p>
          )}
        </div>
        
        {/* Due Date */}
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="due_date"
              className={`block w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.due_date ? 'border-red-300' : 'border-gray-300'
              }`}
              {...register('due_date', { required: 'Due date is required' })}
            />
          </div>
          {errors.due_date && (
            <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceHeader;