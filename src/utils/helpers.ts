import { format } from 'date-fns';

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

export const calculateInvoiceTotal = (
  items: { quantity: number; rate: number }[]
): { subtotal: number; tax: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = 0; // Set appropriate tax calculation based on requirements
  const total = subtotal + tax;
  
  return { subtotal, tax, total };
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