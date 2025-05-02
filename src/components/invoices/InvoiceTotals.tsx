import { formatCurrency } from '../../utils/helpers';

interface InvoiceTotalsProps {
  subtotal: number;
  tax: number;
  total: number;
  selectedCurrency: string;
  taxPercentage: number;
  reverseCalculation: boolean;
}

const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({
  subtotal,
  tax,
  total,
  selectedCurrency,
  taxPercentage,
  reverseCalculation
}) => {
  return (
    <div className="p-6 border-b border-gray-200 bg-gray-50">
      <div className="flex flex-col sm:items-end">
        <div className="sm:w-64 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Subtotal:</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(subtotal, selectedCurrency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">
              Tax ({taxPercentage || 0}%):
            </span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(tax, selectedCurrency)}</span>
          </div>
          <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
            <span className="text-gray-900">Total:</span>
            <span className="text-blue-600">{formatCurrency(total, selectedCurrency)}</span>
          </div>
          {reverseCalculation && (
            <p className="text-xs text-gray-500 italic mt-2">
              * With reverse calculation, your earnings will be {formatCurrency(subtotal, selectedCurrency)} 
              after taxes. Client pays {formatCurrency(total, selectedCurrency)}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotals;