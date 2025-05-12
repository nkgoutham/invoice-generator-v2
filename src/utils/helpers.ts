import { format } from 'date-fns';
import { InvoiceFormData } from '../types/invoice';

export const formatCurrency = (amount: number, currency = 'INR', compact = false): string => {
  const currencyOptions: Record<string, { locale: string, currency: string }> = {
    INR: { locale: 'en-IN', currency: 'INR' },
    USD: { locale: 'en-US', currency: 'USD' }
  };
  
  const options = currencyOptions[currency] || currencyOptions.INR;

  if (compact && amount > 1000) {
    // For chart labels, use compact notation
    return new Intl.NumberFormat(options.locale, {
      style: 'currency',
      currency: options.currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }
  
  return new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: options.currency,
    minimumFractionDigits: 2,
  }).format(amount);
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

export const calculateTaxAndTotal = (
  subtotal: number,
  taxPercentage: number = 0,
  taxName?: string,
  isGstRegistered: boolean = false,
  gstRate: number = 18,
  isTdsApplicable: boolean = false,
  tdsRate: number = 10
): { 
  subtotal: number; 
  tax: number; 
  gst_amount?: number;
  tds_amount?: number;
  total: number;
  amount_payable?: number;
} => {
  const numericSubtotal = Number(subtotal) || 0;
  
  let result: any = {
    subtotal: Math.round(numericSubtotal * 100) / 100
  };
  
  // Handle GST if applicable
  if (isGstRegistered && gstRate > 0) {
    const gstAmount = numericSubtotal * (gstRate / 100);
    result.tax = Math.round(gstAmount * 100) / 100;
    result.gst_amount = Math.round(gstAmount * 100) / 100;
    result.total = Math.round((numericSubtotal + gstAmount) * 100) / 100;
  } else if (taxPercentage > 0) {
    // Use regular tax if GST is not applicable
    const taxAmount = numericSubtotal * (taxPercentage / 100);
    result.tax = Math.round(taxAmount * 100) / 100;
    result.total = Math.round((numericSubtotal + taxAmount) * 100) / 100;
  } else {
    // No tax
    result.tax = 0;
    result.total = numericSubtotal;
  }
  
  // Handle TDS if applicable
  if (isTdsApplicable && tdsRate > 0) {
    const tdsAmount = numericSubtotal * (tdsRate / 100);
    result.tds_amount = Math.round(tdsAmount * 100) / 100;
    result.amount_payable = Math.round((result.total - tdsAmount) * 100) / 100;
  } else {
    result.amount_payable = result.total;
  }
  
  return result;
};

export const calculateInvoiceTotals = (
  formData: Partial<InvoiceFormData>,
  engagementType: string | undefined
): { 
  subtotal: number; 
  tax: number; 
  gst_amount?: number;
  tds_amount?: number;
  total: number;
  amount_payable?: number;
} => {
  const taxPercentage = Number(formData.tax_percentage) || 0;
  const taxName = formData.tax_name;
  const isGstRegistered = formData.is_gst_registered || false;
  const gstRate = Number(formData.gst_rate) || 18;
  
  // Determine if TDS is applicable
  let isTdsApplicable = formData.is_tds_applicable || false;
  const tdsRate = Number(formData.tds_rate) || 10;
  
  let calculatedSubtotal = 0;
  
  if (engagementType === 'milestone' && formData.milestones) {
    calculatedSubtotal = formData.milestones.reduce((sum, milestone) => {
      // Handle both number and string types for amount
      let amount = 0;
      if (typeof milestone.amount === 'number') {
        amount = milestone.amount;
      } else if (milestone.amount) {
        amount = parseFloat(milestone.amount.toString()) || 0;
      }
      return sum + amount;
    }, 0);
  } else if ((engagementType === 'retainership' || engagementType === 'project') && formData.items && formData.items.length > 0) {
    const amount = parseFloat(formData.items[0]?.amount?.toString() || '0') || 0;
    calculatedSubtotal = amount;
  } else if (formData.items) {
    calculatedSubtotal = formData.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount?.toString() || '0') || 0;
      return sum + amount;
    }, 0);
  }
  
  // Auto-enable TDS if subtotal > ₹30,000 and currency is INR, unless explicitly disabled
  if (formData.is_tds_applicable === undefined && formData.currency === 'INR' && calculatedSubtotal > 30000) {
    isTdsApplicable = true;
  }
  
  return calculateTaxAndTotal(
    calculatedSubtotal, 
    taxPercentage, 
    taxName, 
    isGstRegistered, 
    gstRate, 
    isTdsApplicable, 
    tdsRate
  );
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