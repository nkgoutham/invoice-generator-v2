import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import Modal from '../ui/Modal';
import { PAYMENT_METHODS, PaymentDetails } from '../../types/invoice';
import { formatCurrency } from '../../utils/helpers';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentDetails: PaymentDetails) => Promise<void>;
  invoice: {
    id?: string;
    total: number;
    currency: string;
    status?: string;
    partially_paid_amount?: number;
  };
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  invoice
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    payment_date: today,
    payment_method: 'bank_transfer',
    payment_reference: '',
    amount: invoice.total,
    is_partially_paid: false,
    exchange_rate: undefined,
    inr_amount_received: undefined
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showCurrencyFields, setShowCurrencyFields] = useState(false);
  const [exchangeRateOption, setExchangeRateOption] = useState<'rate' | 'amount'>('rate');
  
  // Show currency fields only for USD invoices
  useEffect(() => {
    setShowCurrencyFields(invoice.currency === 'USD');
  }, [invoice.currency]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      
      if (name === 'is_partially_paid') {
        // If switching to partial payment, set amount to 0
        // If switching to full payment, set amount to invoice total
        const newAmount = checked ? 0 : invoice.total;
        
        setPaymentDetails(prev => ({
          ...prev,
          [name]: checked,
          amount: newAmount
        }));
      } else {
        setPaymentDetails(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setPaymentDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear validation errors when user makes changes
    setValidationError(null);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
    setPaymentDetails(prev => ({
      ...prev,
      amount: value
    }));
    setValidationError(null);
  };

  const handleExchangeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
    setPaymentDetails(prev => ({
      ...prev,
      exchange_rate: value,
      // Clear the INR amount when rate is changed
      inr_amount_received: undefined
    }));
    setValidationError(null);
  };

  const handleInrAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
    setPaymentDetails(prev => ({
      ...prev,
      inr_amount_received: value,
      // Clear the exchange rate when INR amount is changed
      exchange_rate: undefined
    }));
    setValidationError(null);
  };

  const handleExchangeRateOptionChange = (option: 'rate' | 'amount') => {
    setExchangeRateOption(option);
    // Clear both values when switching options
    setPaymentDetails(prev => ({
      ...prev,
      exchange_rate: undefined,
      inr_amount_received: undefined
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentDetails.payment_date) {
      setValidationError('Please select a payment date');
      return;
    }
    
    if (paymentDetails.is_partially_paid && paymentDetails.amount <= 0) {
      setValidationError('Please enter a valid payment amount');
      return;
    }
    
    if (paymentDetails.is_partially_paid && paymentDetails.amount >= invoice.total) {
      if (window.confirm('The amount you entered is equal to or greater than the total amount. Would you like to mark this as fully paid instead?')) {
        setPaymentDetails(prev => ({
          ...prev,
          is_partially_paid: false,
          amount: invoice.total
        }));
      }
      return;
    }

    // Validate currency fields if applicable
    if (showCurrencyFields) {
      if (exchangeRateOption === 'rate' && !paymentDetails.exchange_rate) {
        setValidationError('Please enter the USD to INR exchange rate');
        return;
      }
      
      if (exchangeRateOption === 'amount' && !paymentDetails.inr_amount_received) {
        setValidationError('Please enter the INR amount received');
        return;
      }

      // If exchange rate is provided, calculate INR amount received
      if (paymentDetails.exchange_rate && !paymentDetails.inr_amount_received) {
        const inrAmount = paymentDetails.amount * paymentDetails.exchange_rate;
        setPaymentDetails(prev => ({
          ...prev,
          inr_amount_received: inrAmount
        }));
      }

      // If INR amount is provided but not exchange rate, calculate the rate
      if (paymentDetails.inr_amount_received && !paymentDetails.exchange_rate && paymentDetails.amount > 0) {
        const calculatedRate = paymentDetails.inr_amount_received / paymentDetails.amount;
        setPaymentDetails(prev => ({
          ...prev,
          exchange_rate: calculatedRate
        }));
      }
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave({
        ...paymentDetails,
        status: paymentDetails.is_partially_paid ? 'partially_paid' : 'paid'
      });
      // The parent component will handle success feedback
    } catch (error) {
      console.error('Error recording payment:', error);
      setValidationError('Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
              {validationError}
            </div>
          )}

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center">
                <input
                  id="full_payment"
                  name="is_partially_paid"
                  type="radio"
                  checked={!paymentDetails.is_partially_paid}
                  onChange={() => setPaymentDetails(prev => ({
                    ...prev,
                    is_partially_paid: false,
                    amount: invoice.total
                  }))}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="full_payment" className="ml-2 block text-sm text-gray-700">
                  Full Payment
                  <span className="ml-1 text-sm text-gray-500">
                    ({formatCurrency(invoice.total, invoice.currency)})
                  </span>
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="partial_payment"
                  name="is_partially_paid"
                  type="radio"
                  checked={paymentDetails.is_partially_paid}
                  onChange={() => setPaymentDetails(prev => ({
                    ...prev,
                    is_partially_paid: true,
                    amount: 0
                  }))}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="partial_payment" className="ml-2 block text-sm text-gray-700">
                  Partial Payment
                </label>
              </div>
            </div>
          </div>
          
          {/* Payment Amount - Show only for partial payments */}
          {paymentDetails.is_partially_paid && (
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {invoice.currency === 'USD' ? '$' : '₹'}
                  </span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  max={invoice.total.toString()}
                  value={paymentDetails.amount || ''}
                  onChange={handleAmountChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder=""
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <span className="text-gray-500 pr-3 text-xs sm:text-sm">
                    of {formatCurrency(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
              
              {/* Display existing payment info if this is an update */}
              {invoice.status === 'partially_paid' && invoice.partially_paid_amount !== undefined && (
                <div className="mt-2 bg-blue-50 p-2 rounded text-sm">
                  <p className="text-blue-700">
                    Previously paid: {formatCurrency(invoice.partially_paid_amount, invoice.currency)}
                  </p>
                  <p className="text-blue-700">
                    Remaining: {formatCurrency(invoice.total - invoice.partially_paid_amount, invoice.currency)}
                  </p>
                  <p className="text-blue-600 font-medium mt-1">
                    Enter the additional amount you're receiving now.
                  </p>
                </div>
              )}
              
              {paymentDetails.is_partially_paid && paymentDetails.amount > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Remaining balance: {formatCurrency(invoice.total - paymentDetails.amount, invoice.currency)}
                </p>
              )}
            </div>
          )}

          {/* USD to INR conversion - Show only for USD invoices */}
          {showCurrencyFields && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700">USD to INR Conversion</p>
                <p className="text-xs text-gray-500 mt-1">
                  Specify either the exchange rate or the total INR amount received
                </p>
              </div>

              <div className="flex space-x-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleExchangeRateOptionChange('rate')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    exchangeRateOption === 'rate'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Enter Exchange Rate
                </button>
                <button
                  type="button"
                  onClick={() => handleExchangeRateOptionChange('amount')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    exchangeRateOption === 'amount'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Enter INR Amount
                </button>
              </div>

              {exchangeRateOption === 'rate' ? (
                <div>
                  <label htmlFor="exchange_rate" className="block text-sm font-medium text-gray-700 mb-1">
                    USD to INR Exchange Rate
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      id="exchange_rate"
                      name="exchange_rate"
                      min="1"
                      step="0.01"
                      value={paymentDetails.exchange_rate || ''}
                      onChange={handleExchangeRateChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., 83.5"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <span className="text-gray-500 pr-3 text-sm">
                        ₹/$ 
                      </span>
                    </div>
                  </div>
                  
                  {paymentDetails.exchange_rate && paymentDetails.amount > 0 && (
                    <p className="mt-1 text-sm text-green-600">
                      Equivalent to ₹{(paymentDetails.exchange_rate * paymentDetails.amount).toFixed(2)}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="inr_amount_received" className="block text-sm font-medium text-gray-700 mb-1">
                    Total INR Amount Received
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      id="inr_amount_received"
                      name="inr_amount_received"
                      min="1"
                      step="0.01"
                      value={paymentDetails.inr_amount_received || ''}
                      onChange={handleInrAmountChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., 83500"
                    />
                  </div>
                  
                  {paymentDetails.inr_amount_received && paymentDetails.amount > 0 && (
                    <p className="mt-1 text-sm text-green-600">
                      Equivalent to {(paymentDetails.inr_amount_received / paymentDetails.amount).toFixed(2)} ₹/$
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Payment Date */}
          <div>
            <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="payment_date"
                name="payment_date"
                value={paymentDetails.payment_date}
                onChange={handleChange}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                max={today}
              />
            </div>
          </div>
          
          {/* Payment Method */}
          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="payment_method"
              name="payment_method"
              value={paymentDetails.payment_method}
              onChange={handleChange}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {PAYMENT_METHODS.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Payment Reference */}
          <div>
            <label htmlFor="payment_reference" className="block text-sm font-medium text-gray-700 mb-1">
              Reference / Transaction ID
              <span className="ml-1 text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              id="payment_reference"
              name="payment_reference"
              value={paymentDetails.payment_reference}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="e.g., Bank reference, UPI ID, etc."
            />
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;