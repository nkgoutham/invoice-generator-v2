import { useEffect, useState, useRef } from 'react';
import { Download, Printer, Save, Send } from 'lucide-react';
import Modal from '../ui/Modal';
import InvoicePreviewContent from './InvoicePreviewContent';
import { InvoicePreviewData } from '../../types/invoice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoicePreviewData;
  onSave: () => Promise<void>;
  onSend?: () => Promise<void>;
  isSaving: boolean;
  isUpdate?: boolean;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onSend,
  isSaving,
  isUpdate = false
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // Create a clone of the invoice element to apply PDF-specific styling without affecting the visible element
      const invoiceClone = invoiceRef.current.cloneNode(true) as HTMLElement;
      invoiceClone.classList.add('pdf-mode');
      
      // Temporarily append to the document but hide it
      invoiceClone.style.position = 'absolute';
      invoiceClone.style.left = '-9999px';
      invoiceClone.style.width = '1024px'; // Force desktop width
      document.body.appendChild(invoiceClone);
      
      const canvas = await html2canvas(invoiceClone, {
        scale: 1.5, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        windowWidth: 1200, // Force desktop-like rendering
        width: 1024 // Fixed width to ensure desktop layout
      });
      
      // Remove the clone after canvas generation
      document.body.removeChild(invoiceClone);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with compression
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable compression
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice-${data.invoice.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!onSend) return;

    setIsSending(true);
    try {
      await onSend();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <div className="flex flex-col h-full pdf-content">
        <div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 border-b border-gray-200 gap-y-2 pdf-hidden"
          style={{ 
            borderColor: `${data.issuer.primary_color || '#3B82F6'}20`
          }}
        >
          <h2 
            className="text-lg sm:text-xl font-semibold"
            style={{ color: data.issuer.primary_color || '#3B82F6' }}
          >
            Invoice Preview
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              <Download size={16} className="mr-1.5" />
              <span className="hidden xs:inline">{isDownloading ? "Generating..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Printer size={16} className="mr-1.5" />
              <span className="hidden xs:inline">Print</span>
            </button>
            {onSend && (
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Send size={16} className="mr-1.5" />
                <span className="hidden xs:inline">{isSending ? "Sending..." : "Send"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white"
              style={{ 
                backgroundColor: data.issuer.primary_color || '#3B82F6',
                borderColor: `${data.issuer.primary_color || '#3B82F6'}80` 
              }}
            >
              {isSaving ? (
                <>
                  <span className="mr-1.5 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span className="hidden xs:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1.5" />
                  <span className="hidden xs:inline">{isUpdate ? "Update" : "Save"}</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 p-2 sm:p-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl overflow-hidden shadow-lg" ref={invoiceRef}>
            <InvoicePreviewContent data={data} allowDownload={false} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InvoicePreviewModal;