// Function to get the currency conversion rate from the currency settings store
// This is a utility function to simplify currency conversion throughout the app
import { useCurrencyStore } from '../store/currencyStore';

export const getConversionRate = (): number => {
  return useCurrencyStore.getState().currencySettings?.usd_to_inr_rate || 85;
};

export const getPreferredCurrency = (): 'INR' | 'USD' => {
  return useCurrencyStore.getState().currencySettings?.preferred_currency || 'INR';
};

/**
 * Convert an amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: 'USD' | 'INR',
  toCurrency: 'USD' | 'INR',
  conversionRate?: number
): number {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Get the conversion rate - use provided rate or fetch from store
  const rate = conversionRate || getConversionRate();

  // Convert from USD to INR
  if (fromCurrency === 'USD' && toCurrency === 'INR') {
    return amount * rate;
  }

  // Convert from INR to USD
  if (fromCurrency === 'INR' && toCurrency === 'USD') {
    return amount / rate;
  }

  // Fallback
  return amount;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'USD':
      return '$';
    case 'INR':
      return '₹';
    default:
      return currency;
  }
}

export default {
  convertCurrency,
  getCurrencySymbol,
  getConversionRate,
  getPreferredCurrency
};