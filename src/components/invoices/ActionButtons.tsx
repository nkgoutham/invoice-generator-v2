import { Save, Eye } from 'lucide-react';

interface ActionButtonsProps {
  loading: boolean;
  onCancel: () => void;
  showPreviewLink?: boolean;
  onPreviewClick?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  loading, 
  onCancel, 
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
    </div>
  );
};

export default ActionButtons;