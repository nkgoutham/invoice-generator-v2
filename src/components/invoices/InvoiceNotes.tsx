import { UseFormRegister } from 'react-hook-form';
import { InvoiceFormData } from '../../types/invoice';

interface InvoiceNotesProps {
  register: UseFormRegister<InvoiceFormData>;
}

const InvoiceNotes: React.FC<InvoiceNotesProps> = ({ register }) => {
  return (
    <div className="p-6">
      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
        Notes
      </label>
      <textarea
        id="notes"
        rows={3}
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        placeholder="Any additional notes for the client..."
        {...register('notes')}
      ></textarea>
    </div>
  );
};

export default InvoiceNotes;