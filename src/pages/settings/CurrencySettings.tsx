import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { DollarSign, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface CurrencySettingsFormData {
  preferred_currency: string;
  usd_to_inr_rate: number;
}

const CurrencySettings = () => {
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<CurrencySettingsFormData>({
    defaultValues: {
      preferred_currency: 'INR',
      usd_to_inr_rate: 85
    }
  });
  
  // Fetch existing settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('currency_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
            console.error('Error fetching currency settings:', error);
            toast.error('Failed to load currency settings');
          }
        } else if (data) {
          setValue('preferred_currency', data.preferred_currency);
          setValue('usd_to_inr_rate', data.usd_to_inr_rate);
        }
      } catch (error) {
        console.error('Error in fetchSettings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user, setValue]);
  
  const onSubmit = async (data: CurrencySettingsFormData) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Check if settings already exist
      const { data: existingData, error: existingError } = await supabase
        .from('currency_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      let result;
      
      if (existingData) {
        // Update existing settings
        result = await supabase
          .from('currency_settings')
          .update({
            preferred_currency: data.preferred_currency,
            usd_to_inr_rate: data.usd_to_inr_rate
          })
          .eq('user_id', user.id);
      } else {
        // Insert new settings
        result = await supabase
          .from('currency_settings')
          .insert({
            user_id: user.id,
            preferred_currency: data.preferred_currency,
            usd_to_inr_rate: data.usd_to_inr_rate
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Currency settings saved successfully');
    } catch (error) {
      console.error('Error saving currency settings:', error);
      toast.error('Failed to save currency settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Configure Currency Preferences</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Set your preferred currency and conversion rates for revenue calculations.
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {/* Preferred Currency */}
                <div>
                  <label htmlFor="preferred_currency" className="block text-sm font-medium text-gray-700">
                    Preferred Currency
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    This currency will be used to display your revenue totals on the dashboard.
                  </p>
                  <select
                    id="preferred_currency"
                    {...register('preferred_currency', { required: 'Preferred currency is required' })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="INR">₹ INR - Indian Rupee</option>
                    <option value="USD">$ USD - US Dollar</option>
                  </select>
                  {errors.preferred_currency && (
                    <p className="mt-1 text-sm text-red-600">{errors.preferred_currency.message}</p>
                  )}
                </div>
                
                {/* USD to INR Conversion Rate */}
                <div>
                  <label htmlFor="usd_to_inr_rate" className="block text-sm font-medium text-gray-700">
                    USD to INR Conversion Rate
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Enter the current exchange rate for converting between USD and INR.
                  </p>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      1 USD =
                    </span>
                    <input
                      type="number"
                      id="usd_to_inr_rate"
                      {...register('usd_to_inr_rate', { 
                        required: 'Conversion rate is required',
                        min: { value: 0.01, message: 'Rate must be positive' },
                        valueAsNumber: true
                      })}
                      step="0.01"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      INR
                    </span>
                  </div>
                  {errors.usd_to_inr_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.usd_to_inr_rate.message}</p>
                  )}
                </div>
                
                {/* INFO SECTION */}
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800">Currency Conversion Info</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    This exchange rate will be used to convert between currencies in your revenue reports and dashboard. 
                    For accurate financial records, please update this rate regularly to reflect current exchange rates.
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || isLoading || !isDirty}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CurrencySettings;