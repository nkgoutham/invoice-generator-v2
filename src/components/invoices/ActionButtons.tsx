import { Save, Send, CreditCard, Eye } from 'lucide-react';

interface ActionButtonsProps {
  loading: boolean;
  onCancel: () => void;
  onSaveAndSend?: () => void;
  onSaveAndRecordPayment?: () => void;
  showPreviewLink?: boolean;
  onPreviewClick?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  loading, 
  onCancel, 
  onSaveAndSend,
  onSaveAndRecordPayment,
  showPreviewLink = false,
  onPreviewClick
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
      <button
        type="button"
        onClick={onCancel}
        className="w-full sm:w-auto btn btn-secondary btn-md"
      >
        Cancel
      </button>
      
      {showPreviewLink && onPreviewClick && (
        <button
          type="button"
          onClick={onPreviewClick}
          className="w-full sm:w-auto btn btn-secondary btn-md"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </button>
      )}
      
      {onSaveAndRecordPayment && (
        <button
          type="button"
          onClick={onSaveAndRecordPayment}
          disabled={loading}
          className="w-full sm:w-auto btn btn-success btn-md group"
        >
          <CreditCard className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          Save &amp; Record Payment
        </button>
      )}
      
      {onSaveAndSend && (
        <button
          type="button"
          onClick={onSaveAndSend}
          disabled={loading}
          className="w-full sm:w-auto btn btn-primary btn-md group"
        >
          <Send className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          {loading ? (
            <span className="flex items-center">
              <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              Saving...
            </span>
          ) : (
            'Save & Send'
          )}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;