import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { BankingInfo as BankingInfoType } from '../../lib/supabase';

type BankingFormData = Omit<BankingInfoType, 'id' | 'created_at' | 'user_id'>;

const BankingInfo = () => {
  const { user } = useAuthStore();
  const { bankingInfo, loading, error, fetchBankingInfo, updateBankingInfo } = useProfileStore();
  
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<BankingFormData>();
  
  useEffect(() => {
    if (user) {
      fetchBankingInfo(user.id);
    }
  }, [user, fetchBankingInfo]);
  
  useEffect(() => {
    if (bankingInfo) {
      reset({
        account_holder: bankingInfo.account_holder,
        account_number: bankingInfo.account_number,
        ifsc_code: bankingInfo.ifsc_code,
        bank_name: bankingInfo.bank_name,
        branch: bankingInfo.branch,
      });
    }
  }, [bankingInfo, reset]);
  
  const onSubmit = async (data: BankingFormData) => {
    if (!user) return;
    
    try {
      await updateBankingInfo({
        ...data,
        user_id: user.id,
      });
      
      toast.success('Banking information updated successfully');
    } catch (err) {
      toast.error('Failed to update banking information');
    }
  };
  
  if (loading && !bankingInfo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Banking Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your banking details for invoice payments
          </p>
        </div>
        
        {error && (
          <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Account Holder */}
              <div className="sm:col-span-2">
                <label htmlFor="account_holder" className="block text-sm font-medium text-gray-700">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  id="account_holder"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.account_holder ? 'border-red-300' : ''}`}
                  placeholder="Full name as in bank records"
                  {...register('account_holder', { required: 'Account holder name is required' })}
                />
                {errors.account_holder && (
                  <p className="mt-1 text-sm text-red-600">{errors.account_holder.message}</p>
                )}
              </div>
              
              {/* Account Number */}
              <div>
                <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  id="account_number"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.account_number ? 'border-red-300' : ''}`}
                  placeholder="Your bank account number"
                  {...register('account_number', { required: 'Account number is required' })}
                />
                {errors.account_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.account_number.message}</p>
                )}
              </div>
              
              {/* IFSC Code */}
              <div>
                <label htmlFor="ifsc_code" className="block text-sm font-medium text-gray-700">
                  IFSC Code
                </label>
                <input
                  type="text"
                  id="ifsc_code"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.ifsc_code ? 'border-red-300' : ''}`}
                  placeholder="IFSC code of your bank branch"
                  {...register('ifsc_code', { required: 'IFSC code is required' })}
                />
                {errors.ifsc_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.ifsc_code.message}</p>
                )}
              </div>
              
              {/* Bank Name */}
              <div>
                <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bank_name"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.bank_name ? 'border-red-300' : ''}`}
                  placeholder="Name of your bank"
                  {...register('bank_name', { required: 'Bank name is required' })}
                />
                {errors.bank_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.bank_name.message}</p>
                )}
              </div>
              
              {/* Branch */}
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <input
                  type="text"
                  id="branch"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.branch ? 'border-red-300' : ''}`}
                  placeholder="Your bank branch name"
                  {...register('branch', { required: 'Branch name is required' })}
                />
                {errors.branch && (
                  <p className="mt-1 text-sm text-red-600">{errors.branch.message}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={loading || !isDirty}
              className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankingInfo;