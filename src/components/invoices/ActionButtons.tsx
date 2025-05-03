import { Save, FileText, Download, Send } from 'lucide-react';

interface ActionButtonsProps {
  loading: boolean;
  onCancel: () => void;
  onPreview: () => void;
  onDownload?: () => void;
  onSend?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  loading, 
  onCancel, 
  onPreview, 
  onDownload,
  onSend 
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 mb-8">
      <button
        type="button"
        onClick={onCancel}
        className="w-full sm:w-auto btn btn-secondary btn-md"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto btn btn-primary btn-md group"
      >
        <Save className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
        {loading ? (
          <span className="flex items-center">
            <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            Saving...
          </span>
        ) : (
          'Save Invoice'
        )}
      </button>
      <button
        type="button"
        onClick={onPreview}
        disabled={loading}
        className="w-full sm:w-auto btn btn-success btn-md group"
      >
        <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
        <span className="hidden xs:inline">View</span> Invoice
      </button>
      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          disabled={loading}
          className="w-full sm:w-auto btn btn-secondary btn-md group"
        >
          <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          <span className="hidden xs:inline">Download</span> PDF
        </button>
      )}
      {onSend && (
        <button
          type="button"
          onClick={onSend}
          disabled={loading}
          className="w-full sm:w-auto btn btn-accent btn-md group"
        >
          <Send className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          <span className="hidden xs:inline">Send to</span> Client
        </button>
      )}
    </div>
  );
};

export default ActionButtons;