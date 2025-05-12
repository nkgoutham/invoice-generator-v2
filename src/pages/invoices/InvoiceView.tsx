import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useProfileStore } from '../../store/profileStore';
import { useClientStore } from '../../store/clientStore';
import { normalizeInvoiceData } from '../../utils/invoiceDataTransform';
import { InvoicePreviewData } from '../../types/invoice';
import InvoicePreviewContent from '../../components/invoices/InvoicePreviewContent';
import RecordPaymentModal from '../../components/invoices/RecordPaymentModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { selectedInvoice, invoiceItems, fetchInvoice, fetchInvoiceItems, recordPayment, loading } = useInvoiceStore();
  const { profile, bankingInfo, fetchProfile, fetchBankingInfo } = useProfileStore();
  const { getClient } = useClientStore();
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewData, setPreviewData] = useState<InvoicePreviewData | null>(null);
  const [client, setClient] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (id) {
      fetchInvoice(id);
      fetchInvoiceItems(id);
    }
  }, [id, fetchInvoice, fetchInvoiceItems]);
  
  useEffect(() => {
    const loadData = async () => {
      if (selectedInvoice) {
        await fetchProfile(selectedInvoice.user_id);
        await fetchBankingInfo(selectedInvoice.user_id);
        
        try {
          const clientData = await getClient(selectedInvoice.client_id);
          setClient(clientData);
        } catch (error) {
          console.error("Error loading client details:", error);
        }
      }
    };
    
    loadData();
  }, [selectedInvoice, fetchProfile, fetchBankingInfo, getClient]);
  
  // Prepare preview data
  useEffect(() => {
    if (selectedInvoice && profile && client) {
      const data: Partial<InvoicePreviewData> = {
        issuer: {
          business_name: profile.business_name || 'Your Business',
          address: profile.address || '',
          pan_number: profile.pan_number,
          phone: profile.phone,
          logo_url: profile.logo_url || undefined,
          primary_color: profile.primary_color,
          secondary_color: profile.secondary_color,
          footer_text: profile.footer_text
        },
        client: {
          name: client.name || '',
          company_name: client.company_name,
          billing_address: client.billing_address,
          email: client.email,
          phone: client.phone,
          gst_number: client.gst_number
        },
        banking: bankingInfo ? {
          account_holder: bankingInfo.account_holder,
          account_number: bankingInfo.account_number,
          ifsc_code: bankingInfo.ifsc_code,
          bank_name: bankingInfo.bank_name,
          branch: bankingInfo.branch
        } : undefined,
        invoice: {
          invoice_number: selectedInvoice.invoice_number,
          issue_date: selectedInvoice.issue_date,
          due_date: selectedInvoice.due_date,
          subtotal: selectedInvoice.subtotal,
          tax: selectedInvoice.tax,
          total: selectedInvoice.total,
          notes: selectedInvoice.notes,
          currency: selectedInvoice.currency || 'INR',
          tax_percentage: selectedInvoice.tax_percentage || 0,
          engagement_type: selectedInvoice.engagement_type,
          payment_date: selectedInvoice.payment_date,
          payment_method: selectedInvoice.payment_method,
          payment_reference: selectedInvoice.payment_reference,
          is_partially_paid: selectedInvoice.is_partially_paid,
          partially_paid_amount: selectedInvoice.partially_paid_amount,
          status: selectedInvoice.status
        }
      };
      
      // Handle items based on engagement type
      if (selectedInvoice.engagement_type === 'milestone') {
        data.invoice!.milestones = invoiceItems.map(item => ({
          name: item.description || item.milestone_name || 'Milestone',
          amount: item.amount
        }));
      } else {
        data.invoice!.items = invoiceItems;
      }
      
      // Normalize to ensure all required fields are present
      setPreviewData(normalizeInvoiceData(data));
    }
  }, [selectedInvoice, profile, client, bankingInfo, invoiceItems]);
  
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // Create a clone of the invoice element to apply PDF-specific styling
      const invoiceClone = invoiceRef.current.cloneNode(true) as HTMLElement;
      
      // Apply PDF-specific styling
      invoiceClone.classList.add('pdf-mode');
      
      // Remove any download buttons from the clone
      const downloadButtons = invoiceClone.querySelectorAll('.pdf-hidden');
      downloadButtons.forEach(button => {
        button.remove();
      });
      
      // Temporarily append to the document but hide it
      invoiceClone.style.position = 'absolute';
      invoiceClone.style.left = '-9999px';
      invoiceClone.style.width = '1024px'; // Force desktop width for consistency
      document.body.appendChild(invoiceClone);
      
      const canvas = await html2canvas(invoiceClone, {
        scale: 2, // Increase scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        windowWidth: 1200, // Force desktop-like rendering
        width: 1024 // Fixed width to ensure desktop layout
      });
      
      // Remove the clone after canvas generation
      document.body.removeChild(invoiceClone);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use higher quality JPEG
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable compression
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice-${selectedInvoice?.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const handleRecordPayment = async (paymentDetails: any) => {
    if (!id) return;

    try {
      await recordPayment(id, paymentDetails);
      toast.success('Payment recorded successfully');
      // Refresh the invoice data
      fetchInvoice(id);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };
  
  if (loading || !selectedInvoice || !previewData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const showRecordPayment = ['draft', 'sent', 'overdue', 'partially_paid'].includes(selectedInvoice.status);
  
  return (
    <div className="fixed inset-0 bg-gray-100 overflow-auto">
      {/* Fixed position buttons - properly marked with pdf-hidden class */}
      <div className="fixed top-4 right-4 z-10 space-x-2 print:hidden pdf-hidden">
        {showRecordPayment && (
          <button
            onClick={() => navigate(`/invoices/${id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md text-sm font-medium"
          >
            Manage Invoice
          </button>
        )}
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md text-sm font-medium flex items-center"
        >
          <Download className="mr-2 h-4 w-4" />
          {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
      
      {previewData && (
        <div 
          ref={invoiceRef} 
          className="invoice-container"
        >
          <InvoicePreviewContent data={previewData} allowDownload={false} />
        </div>
      )}
      
      {/* Payment Recording Modal */}
      <RecordPaymentModal 
        isOpen={false}
        onClose={() => {}}
        onSave={handleRecordPayment}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default InvoiceView;