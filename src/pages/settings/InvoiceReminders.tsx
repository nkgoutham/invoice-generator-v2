import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useReminderStore } from '../../store/reminderStore';
import { Plus, Minus, Mail, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { InvoiceReminderFormData } from '../../types/invoice';

const InvoiceReminders = () => {
  const { user } = useAuthStore();
  const { reminderSettings, fetchReminderSettings, createReminderSettings, updateReminderSettings, loading } = useReminderStore();
  
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);
  
  const { 
    register, 
    control, 
    handleSubmit, 
    reset,
    formState: { errors, isDirty } 
  } = useForm<InvoiceReminderFormData>({
    defaultValues: {
      days_before_due: [7, 1],
      days_after_due: [1, 3, 7],
      reminder_subject: 'Invoice Reminder: #{invoice_number}',
      reminder_message: 'This is a friendly reminder that invoice #{invoice_number} for {amount} is {status}. Please make payment at your earliest convenience.',
      enabled: true
    }
  });
  
  const { fields: beforeDueFields, append: appendBeforeDue, remove: removeBeforeDue } = useFieldArray({
    control,
    name: 'days_before_due'
  });
  
  const { fields: afterDueFields, append: appendAfterDue, remove: removeAfterDue } = useFieldArray({
    control,
    name: 'days_after_due'
  });
  
  // Fetch reminder settings on component mount
  useEffect(() => {
    if (user) {
      fetchReminderSettings(user.id);
    }
  }, [user, fetchReminderSettings]);
  
  // Populate form with existing settings when they're loaded
  useEffect(() => {
    if (reminderSettings) {
      reset({
        days_before_due: reminderSettings.days_before_due,
        days_after_due: reminderSettings.days_after_due,
        reminder_subject: reminderSettings.reminder_subject,
        reminder_message: reminderSettings.reminder_message,
        enabled: reminderSettings.enabled
      });
    }
  }, [reminderSettings, reset]);
  
  // Add a new "days before due" reminder
  const addDaysBeforeDue = () => {
    appendBeforeDue(1);
  };
  
  // Add a new "days after due" reminder
  const addDaysAfterDue = () => {
    appendAfterDue(1);
  };
  
  // Handle form submission
  const onSubmit = async (data: InvoiceReminderFormData) => {
    if (!user) return;
    
    try {
      if (reminderSettings) {
        await updateReminderSettings(reminderSettings.id, data);
      } else {
        await createReminderSettings(data, user.id);
      }
      
      setIsSettingsSaved(true);
      setTimeout(() => setIsSettingsSaved(false), 3000);
      toast.success('Reminder settings saved successfully');
    } catch (error) {
      console.error('Failed to save reminder settings:', error);
      toast.error('Failed to save reminder settings');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Configure Invoice Reminders</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Set up automatic email reminders to be sent to clients before and after invoice due dates.
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* Enable/Disable Reminders */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="enabled"
                  type="checkbox"
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  {...register('enabled')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="enabled" className="font-medium text-gray-700">Enable invoice reminders</label>
                <p className="text-gray-500">When enabled, reminders will be sent automatically based on your settings.</p>
              </div>
            </div>
            
            {/* Reminders Before Due Date */}
            <div>
              <label className="text-base font-medium text-gray-900">Reminders Before Due Date</label>
              <p className="text-sm text-gray-500 mt-1">
                Send reminders to clients before invoices are due.
              </p>
              
              <div className="mt-3 space-y-3">
                {beforeDueFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      min="1"
                      max="90"
                      {...register(`days_before_due.${index}` as const, { 
                        required: 'Required',
                        min: { value: 1, message: 'Min 1 day' },
                        max: { value: 90, message: 'Max 90 days' },
                      })}
                    />
                    <span className="text-sm text-gray-700">
                      day{parseInt(field.toString()) !== 1 ? 's' : ''} before due date
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        if (beforeDueFields.length > 1) {
                          removeBeforeDue(index);
                        } else {
                          toast.error('At least one reminder is required');
                        }
                      }}
                      className="ml-auto p-1 text-gray-400 hover:text-red-500"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {errors.days_before_due && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Please enter valid days (1-90)
                  </p>
                )}
                
                <button
                  type="button"
                  onClick={addDaysBeforeDue}
                  className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Reminder
                </button>
              </div>
            </div>
            
            {/* Reminders After Due Date */}
            <div>
              <label className="text-base font-medium text-gray-900">Reminders After Due Date</label>
              <p className="text-sm text-gray-500 mt-1">
                Send reminders to clients after invoices are overdue.
              </p>
              
              <div className="mt-3 space-y-3">
                {afterDueFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      min="1"
                      max="90"
                      {...register(`days_after_due.${index}` as const, { 
                        required: 'Required',
                        min: { value: 1, message: 'Min 1 day' },
                        max: { value: 90, message: 'Max 90 days' },
                      })}
                    />
                    <span className="text-sm text-gray-700">
                      day{parseInt(field.toString()) !== 1 ? 's' : ''} after due date
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        if (afterDueFields.length > 1) {
                          removeAfterDue(index);
                        } else {
                          toast.error('At least one reminder is required');
                        }
                      }}
                      className="ml-auto p-1 text-gray-400 hover:text-red-500"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {errors.days_after_due && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Please enter valid days (1-90)
                  </p>
                )}
                
                <button
                  type="button"
                  onClick={addDaysAfterDue}
                  className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Reminder
                </button>
              </div>
            </div>
            
            {/* Email Template */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-medium text-gray-900">Email Template</h3>
              <p className="text-sm text-gray-500 mt-1">
                Customize the email subject and message for reminders.
                Use placeholders: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{'{invoice_number}'}</code>, 
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{'{amount}'}</code>, 
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{'{due_date}'}</code>, 
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{'{status}'}</code>
              </p>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="reminder_subject" className="block text-sm font-medium text-gray-700">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    id="reminder_subject"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Invoice Reminder: #{invoice_number}"
                    {...register('reminder_subject', { required: 'Subject is required' })}
                  />
                </div>
                
                <div>
                  <label htmlFor="reminder_message" className="block text-sm font-medium text-gray-700">
                    Email Message
                  </label>
                  <textarea
                    id="reminder_message"
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="This is a friendly reminder that invoice #{invoice_number} for {amount} is {status}. Please make payment at your earliest convenience."
                    {...register('reminder_message', { required: 'Message is required' })}
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Preview */}
            <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-900">Reminder Schedule Preview</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Based on your settings, reminders will be sent at these times:
              </p>
              
              <div className="space-y-1.5 text-sm">
                {beforeDueFields.length > 0 && (
                  <div>
                    <span className="font-medium">Before due date:</span>{' '}
                    {beforeDueFields.map((field, index) => (
                      <span key={field.id} className="inline-flex items-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {field.toString()} day{parseInt(field.toString()) !== 1 ? 's' : ''} before
                        {index < beforeDueFields.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
                
                {afterDueFields.length > 0 && (
                  <div>
                    <span className="font-medium">After due date:</span>{' '}
                    {afterDueFields.map((field, index) => (
                      <span key={field.id} className="inline-flex items-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {field.toString()} day{parseInt(field.toString()) !== 1 ? 's' : ''} after
                        {index < afterDueFields.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end">
            {isSettingsSaved && (
              <div className="mr-3 inline-flex items-center px-3 py-2 text-sm text-green-700 bg-green-100 rounded-md">
                <CheckCircle className="h-4 w-4 mr-2" />
                Saved successfully
              </div>
            )}
            <button
              type="submit"
              disabled={loading || (!isDirty && reminderSettings !== null)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default InvoiceReminders;