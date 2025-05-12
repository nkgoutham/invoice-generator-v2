import { formatCurrency } from '../../utils/helpers';

interface InvoiceTotalsProps {
  subtotal: number;
  tax: number;
  total: number;
  selectedCurrency: string;
  taxPercentage: number;
  taxName?: string;
  isGstRegistered?: boolean;
  gstRate?: number;
  gstAmount?: number;
  isTdsApplicable?: boolean;
  tdsRate?: number;
  tdsAmount?: number;
  amountPayable?: number;
}

const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({
  subtotal,
  tax,
  total,
  selectedCurrency,
  taxPercentage,
  taxName,
  isGstRegistered,
  gstRate,
  gstAmount,
  isTdsApplicable,
  tdsRate,
  tdsAmount,
  amountPayable
}) => {
  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
      <div className="flex flex-col sm:items-end">
        <div className="sm:w-64 space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Subtotal:</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(subtotal, selectedCurrency)}</span>
          </div>
          
          {/* GST or Regular Tax */}
          {isGstRegistered ? (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">
                GST ({gstRate || 18}%):
              </span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(gstAmount || tax, selectedCurrency)}</span>
            </div>
          ) : (
            taxPercentage > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  {taxName ? `${taxName} (${taxPercentage || 0}%)` : `Tax (${taxPercentage || 0}%)`}:
                </span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(tax, selectedCurrency)}</span>
              </div>
            )
          )}
          
          {/* Invoice Total */}
          <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
            <span className="text-gray-900">Total:</span>
            <span className="text-blue-600">{formatCurrency(total, selectedCurrency)}</span>
          </div>
          
          {/* TDS Section */}
          {isTdsApplicable && (
            <>
              <div className="flex justify-between text-red-600">
                <span className="text-sm font-medium">
                  TDS Deduction ({tdsRate || 10}%):
                </span>
                <span className="text-sm font-medium">- {formatCurrency(tdsAmount || 0, selectedCurrency)}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
                <span className="text-gray-900">Amount Payable:</span>
                <span className="text-green-600">{formatCurrency(amountPayable || total, selectedCurrency)}</span>
              </div>
              
              <div className="text-xs text-gray-500 mt-1 italic">
                * TDS will be deducted by the client at the time of payment
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotals;