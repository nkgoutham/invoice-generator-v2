import { useEffect, useRef, useState } from 'react';
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

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { selectedInvoice, invoiceItems, fetchInvoice, fetchInvoiceItems, recordPayment, loading } = useInvoiceStore();
  const { profile, bankingInfo, fetchProfile, fetchBankingInfo } = useProfileStore();
  const { getClient } = useClientStore();
  
  const [client, setClient] = useState<any>(null);
  const [previewData, setPreviewData] = useState<InvoicePreviewData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
        
        // Load client details
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
          footer_text: profile.footer_text,
          gstin: selectedInvoice.gstin
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
          tax_name: selectedInvoice.tax_name,
          engagement_type: selectedInvoice.engagement_type,
          payment_date: selectedInvoice.payment_date,
          payment_method: selectedInvoice.payment_method,
          payment_reference: selectedInvoice.payment_reference,
          is_partially_paid: selectedInvoice.is_partially_paid,
          partially_paid_amount: selectedInvoice.partially_paid_amount,
          status: selectedInvoice.status,
          // GST and TDS fields
          is_gst_registered: selectedInvoice.is_gst_registered,
          gstin: selectedInvoice.gstin,
          gst_rate: selectedInvoice.gst_rate,
          is_tds_applicable: selectedInvoice.is_tds_applicable,
          tds_rate: selectedInvoice.tds_rate
        }
      };

      // Handle items based on engagement type
      if (selectedInvoice.engagement_type === 'milestone') {
        // For milestone-based, create milestone entries
        data.invoice!.milestones = invoiceItems.map(item => ({
          name: item.description || item.milestone_name || 'Milestone',
          amount: item.amount
        }));
      } else {
        // For other types, use the invoiceItems directly
        data.invoice!.items = invoiceItems;
      }

      // Normalize data to ensure all required fields are present
      setPreviewData(normalizeInvoiceData(data));
    }
  }, [selectedInvoice, profile, client, bankingInfo, invoiceItems]);

  const handleRecordPayment = async (paymentDetails: any) => {
    if (!id) return;

    try {
      await recordPayment(id, paymentDetails);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      // Refresh the invoice data
      fetchInvoice(id);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };
  
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      // Create a clone of the element to apply PDF-specific styling
      const invoiceClone = invoiceRef.current.cloneNode(true) as HTMLElement;
      invoiceClone.classList.add('pdf-mode');
      
      // Hide UI elements for PDF export
      const downloadButton = invoiceClone.querySelector('.pdf-hidden');
      if (downloadButton) {
        downloadButton.remove();
      }
      
      // Position off-screen during capturing
      invoiceClone.style.position = 'absolute';
      invoiceClone.style.left = '-9999px';
      invoiceClone.style.width = '1024px';
      document.body.appendChild(invoiceClone);
      
      // Generate PDF
      const canvas = await html2canvas(invoiceClone, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        windowWidth: 1200,
        width: 1024
      });
      
      document.body.removeChild(invoiceClone);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice-${selectedInvoice?.invoice_number}.pdf`);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
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
    <div className="fixed inset-0 bg-gray-100 overflow-auto" ref={invoiceRef}>
      <div className="fixed top-4 right-4 z-10 space-x-2 print:hidden pdf-hidden">
        {showRecordPayment && (
          <button
            onClick={() => navigate(`/invoices/${id}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Manage Invoice
          </button>
        )}
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Download PDF
        </button>
      </div>
      
      {previewData && <InvoicePreviewContent data={previewData} allowDownload={true} />}
      
      {/* Payment Recording Modal */}
      <RecordPaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSave={handleRecordPayment}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default InvoiceView;