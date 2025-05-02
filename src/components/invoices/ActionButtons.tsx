import { Save, FileText } from 'lucide-react';

interface ActionButtonsProps {
  loading: boolean;
  onCancel: () => void;
  onPreview: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ loading, onCancel, onPreview }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 mb-8">
      <button
        type="button"
        onClick={onCancel}
        className="btn btn-secondary btn-md"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary btn-md group"
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
        className="btn btn-success btn-md group"
      >
        <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
        Preview
      </button>
    </div>
  );
};

export default ActionButtons;