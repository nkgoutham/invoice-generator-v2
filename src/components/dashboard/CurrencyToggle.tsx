import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCurrencyStore } from '../../store/currencyStore';

interface CurrencyToggleProps {
  className?: string;
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ className = '' }) => {
  const { user } = useAuthStore();
  const { currencySettings, fetchCurrencySettings, updateCurrencySettings, loading } = useCurrencyStore();
  
  useEffect(() => {
    if (user && !currencySettings) {
      fetchCurrencySettings(user.id);
    }
  }, [user, currencySettings, fetchCurrencySettings]);
  
  const handleCurrencyToggle = () => {
    if (!currencySettings || loading) return;
    
    const newCurrency = currencySettings.preferred_currency === 'INR' ? 'USD' : 'INR';
    
    updateCurrencySettings({
      preferred_currency: newCurrency
    });
  };
  
  if (!currencySettings) {
    return null;
  }
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span 
        className={`text-sm ${currencySettings.preferred_currency === 'USD' ? 'font-medium text-blue-600' : 'text-gray-500'}`}
      >
        USD
      </span>
      
      <button 
        type="button"
        onClick={handleCurrencyToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          currencySettings.preferred_currency === 'INR' ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        aria-pressed={currencySettings.preferred_currency === 'INR'}
        aria-labelledby="currency-toggle"
      >
        <span className="sr-only" id="currency-toggle">
          Toggle currency between INR and USD
        </span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            currencySettings.preferred_currency === 'INR' ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
      
      <span 
        className={`text-sm ${currencySettings.preferred_currency === 'INR' ? 'font-medium text-blue-600' : 'text-gray-500'}`}
      >
        INR
      </span>
    </div>
  );
};

export default CurrencyToggle;