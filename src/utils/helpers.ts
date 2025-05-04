import { format } from 'date-fns';
import { InvoiceFormData } from '../types/invoice';

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  const currencyOptions: Record<string, { locale: string, currency: string }> = {
    INR: { locale: 'en-IN', currency: 'INR' },
    USD: { locale: 'en-US', currency: 'USD' }
  };
  
  const options = currencyOptions[currency] || currencyOptions.INR;
  
  return new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: options.currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format currency with conversion if needed
export const formatCurrencyWithConversion = (amount: number, fromCurrency: string, toCurrency: string, conversionRate: number): string => {
  // Skip conversion if currencies are the same
  if (fromCurrency === toCurrency) {
    return formatCurrency(amount, toCurrency);
  }

  let convertedAmount = amount;

  // Convert from USD to INR
  if (fromCurrency === 'USD' && toCurrency === 'INR') {
    convertedAmount = amount * conversionRate;
  }
  // Convert from INR to USD
  else if (fromCurrency === 'INR' && toCurrency === 'USD') {
    convertedAmount = amount / conversionRate;
  }

  return formatCurrency(convertedAmount, toCurrency);
};

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'dd MMM yyyy');
};

export const generateInvoiceNumber = (prefix = 'INV', userId: string): string => {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${prefix}-${year}-${month}-${random}`;
};

export const calculateDueDate = (issueDate: string, days = 15): string => {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Calculate invoice totals for service-based engagements
 * @param items Array of invoice items with quantity and rate
 * @param taxPercentage Tax percentage to apply
 * @param reverseCalculation Whether to use reverse tax calculation
 */
export const calculateServiceTotal = (
  items: { quantity: number; rate: number; amount?: number; }[],
  taxPercentage: number = 0,
  reverseCalculation: boolean = false
): { subtotal: number; tax: number; total: number } => {
  // Calculate subtotal by summing up all line items
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    return sum + (quantity * rate);
  }, 0);
  
  return calculateTaxAndTotal(subtotal, taxPercentage, reverseCalculation);
};

/**
 * Calculate invoice totals for retainership-based engagements
 * @param amount Monthly retainer amount
 * @param taxPercentage Tax percentage to apply
 * @param reverseCalculation Whether to use reverse tax calculation
 */
export const calculateRetainershipTotal = (
  amount: number,
  taxPercentage: number = 0,
  reverseCalculation: boolean = false
): { subtotal: number; tax: number; total: number } => {
  return calculateTaxAndTotal(amount, taxPercentage, reverseCalculation);
};

/**
 * Calculate invoice totals for project-based engagements
 * @param amount Project fee amount
 * @param taxPercentage Tax percentage to apply
 * @param reverseCalculation Whether to use reverse tax calculation
 */
export const calculateProjectTotal = (
  amount: number,
  taxPercentage: number = 0,
  reverseCalculation: boolean = false
): { subtotal: number; tax: number; total: number } => {
  return calculateTaxAndTotal(amount, taxPercentage, reverseCalculation);
};

/**
 * Calculate invoice totals for milestone-based engagements
 * @param milestones Array of milestone objects with amount property
 * @param taxPercentage Tax percentage to apply
 * @param reverseCalculation Whether to use reverse tax calculation
 */
export const calculateMilestoneTotal = (
  milestones: { name?: string; amount: number; }[],
  taxPercentage: number = 0,
  reverseCalculation: boolean = false
): { subtotal: number; tax: number; total: number } => {
  // Calculate subtotal by summing up all milestone amounts
  const subtotal = milestones.reduce((sum, milestone) => {
    return sum + (Number(milestone.amount) || 0);
  }, 0);
  
  return calculateTaxAndTotal(subtotal, taxPercentage, reverseCalculation);
};

/**
 * Shared function to calculate tax and total based on subtotal
 * @param subtotal The subtotal amount
 * @param taxPercentage Tax percentage to apply
 * @param reverseCalculation Whether to use reverse tax calculation
 */
export const calculateTaxAndTotal = (
  subtotal: number,
  taxPercentage: number = 0,
  reverseCalculation: boolean = false
): { subtotal: number; tax: number; total: number } => {
  // Ensure values are numbers
  const numericSubtotal = Number(subtotal) || 0;
  const numericTaxRate = Number(taxPercentage) || 0;
  
  let calculatedTax = 0;
  let calculatedTotal = 0;
  let calculatedSubtotal = numericSubtotal;
  
  if (reverseCalculation && numericTaxRate > 0) {
    // Reverse calculation (calculate what subtotal should be to achieve desired net amount)
    const taxFactor = 1 - (numericTaxRate / 100);
    if (taxFactor > 0) {
      calculatedTotal = numericSubtotal / taxFactor;
      calculatedTax = calculatedTotal - numericSubtotal;
    } else {
      calculatedTotal = numericSubtotal;
      calculatedTax = 0;
    }
  } else {
    // Forward calculation (add tax to subtotal)
    calculatedTax = numericSubtotal * (numericTaxRate / 100);
    calculatedTotal = numericSubtotal + calculatedTax;
  }
  
  // Round to 2 decimal places for display consistency
  return {
    subtotal: Math.round(calculatedSubtotal * 100) / 100,
    tax: Math.round(calculatedTax * 100) / 100,
    total: Math.round(calculatedTotal * 100) / 100
  };
};

/**
 * Calculate invoice totals based on engagement type and form data
 */
export const calculateInvoiceTotals = (
  formData: Partial<InvoiceFormData>,
  engagementType: string | undefined
): { subtotal: number; tax: number; total: number } => {
  const taxPercentage = Number(formData.tax_percentage) || 0;
  const reverseCalculation = Boolean(formData.reverse_calculation);
  
  switch (engagementType) {
    case 'retainership':
      if (formData.items && formData.items.length > 0) {
        const amount = Number(formData.items[0].rate) || 0;
        return calculateRetainershipTotal(amount, taxPercentage, reverseCalculation);
      }
      break;
      
    case 'project':
      if (formData.items && formData.items.length > 0) {
        const amount = Number(formData.items[0].rate) || 0;
        return calculateProjectTotal(amount, taxPercentage, reverseCalculation);
      }
      break;
      
    case 'milestone':
      if (formData.milestones && formData.milestones.length > 0) {
        return calculateMilestoneTotal(formData.milestones, taxPercentage, reverseCalculation);
      }
      break;
      
    case 'service':
    default:
      if (formData.items) {
        return calculateServiceTotal(formData.items, taxPercentage, reverseCalculation);
      }
      break;
  }
  
  // Default return if no conditions are met
  return { subtotal: 0, tax: 0, total: 0 };
};

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export const engagementTypes = [
  { value: 'retainership', label: 'Retainership' },
  { value: 'project', label: 'Project Based' },
  { value: 'milestone', label: 'Milestone Based' },
  { value: 'service', label: 'Service Based' }
];

export const currencyOptions = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' }
];