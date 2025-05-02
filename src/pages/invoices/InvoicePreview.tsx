import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useProfileStore } from '../../store/profileStore';
import { useClientStore } from '../../store/clientStore';
import { ArrowLeft, Download, Printer, Send, ExternalLink, CreditCard } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { InvoicePreviewData } from '../../types/invoice';
import InvoicePreviewContent from '../../components/invoices/InvoicePreviewContent';
import RecordPaymentModal from '../../components/invoices/RecordPaymentModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const InvoicePreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { selectedInvoice, invoiceItems, fetchInvoice, fetchInvoiceItems, updateInvoiceStatus, loading, recordPayment } = useInvoiceStore();
  const { profile, bankingInfo, fetchProfile, fetchBankingInfo } = useProfileStore();
  const { getClient } = useClientStore();
  
  const [client, setClient] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewData, setPreviewData] = useState<InvoicePreviewData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
      const data: InvoicePreviewData = {
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
          items: selectedInvoice.engagement_type !== 'milestone' ? invoiceItems : undefined,
          milestones: selectedInvoice.engagement_type === 'milestone' ? 
            invoiceItems.map(item => ({ name: item.description || item.milestone_name || '', amount: item.amount })) : 
            undefined,
          payment_date: selectedInvoice.payment_date,
          payment_method: selectedInvoice.payment_method,
          payment_reference: selectedInvoice.payment_reference,
          is_partially_paid: selectedInvoice.is_partially_paid,
          partially_paid_amount: selectedInvoice.partially_paid_amount,
          status: selectedInvoice.status
        }
      };
      
      setPreviewData(data);
    }
  }, [selectedInvoice, profile, client, bankingInfo, invoiceItems]);
  
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsPrinting(true);
    
    try {
      // Create a clone of the invoice element to apply PDF-specific styling without affecting the visible element
      const invoiceClone = invoiceRef.current.cloneNode(true) as HTMLElement;
      
      // Apply PDF-specific styling
      invoiceClone.classList.add('pdf-mode');
      
      // Temporarily append to the document but hide it
      invoiceClone.style.position = 'absolute';
      invoiceClone.style.left = '-9999px';
      invoiceClone.style.width = '1024px'; // Force desktop width
      document.body.appendChild(invoiceClone);
      
      const canvas = await html2canvas(invoiceClone, {
        scale: 1.5, // Lower scale for better compression
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        windowWidth: 1200, // Force desktop-like rendering
        width: 1024 // Fixed width to ensure desktop layout
      });
      
      // Remove the clone after canvas generation
      document.body.removeChild(invoiceClone);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG with compression
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
      setIsPrinting(false);
    }
  };
  
  const handlePrint = () => {
    if (invoiceRef.current) {
      // Add print mode class
      invoiceRef.current.classList.add('pdf-mode');
      
      // Print
      window.print();
      
      // Remove class after printing
      setTimeout(() => {
        invoiceRef.current?.classList.remove('pdf-mode');
      }, 500);
    }
  };
  
  const handleMarkAsSent = async () => {
    if (id && selectedInvoice?.status === 'draft') {
      try {
        await updateInvoiceStatus(id, 'sent');
        toast.success('Invoice marked as sent');
      } catch (error) {
        toast.error('Failed to update invoice status');
      }
    }
  };

  const handleSendEmail = () => {
    toast.error('Email functionality is not implemented yet');
  };

  const handleRecordPayment = async (paymentData: any) => {
    if (!id) return;

    try {
      await recordPayment(id, paymentData);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      // Refresh the invoice data
      fetchInvoice(id);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };
  
  if (loading || !selectedInvoice || !previewData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="print:hidden mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-3">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => navigate(`/invoices/${id}`)}
              className="mr-3 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoice Preview</h1>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50 shadow-sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 inline-block mr-1" />
              <span className="hidden sm:inline">Print</span>
            </button>
            
            <button
              type="button"
              disabled={isPrinting}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 shadow-sm"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 inline-block mr-1" />
              <span className="hidden sm:inline">{isPrinting ? 'Generating...' : 'Download PDF'}</span>
            </button>
            
            {selectedInvoice.status === 'draft' && (
              <button
                type="button"
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm"
                onClick={handleMarkAsSent}
              >
                <Send className="h-4 w-4 inline-block mr-1" />
                <span className="hidden sm:inline">Mark as Sent</span>
              </button>
            )}
            
            {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue' || selectedInvoice.status === 'partially_paid') && (
              <button
                type="button"
                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 shadow-sm"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="h-4 w-4 inline-block mr-1" />
                <span className="hidden sm:inline">{selectedInvoice.status === 'partially_paid' ? 'Update Payment' : 'Record Payment'}</span>
              </button>
            )}
            
            <button
              type="button"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm"
              onClick={handleSendEmail}
            >
              <ExternalLink className="h-4 w-4 inline-block mr-1" />
              <span className="hidden sm:inline">Send to Client</span>
            </button>
          </div>
        </div>
      </div>
      
      <div 
        className="bg-white rounded-xl overflow-hidden shadow-xl print:shadow-none invoice-preview-container" 
        ref={invoiceRef}
      >
        {previewData && <InvoicePreviewContent data={previewData} />}
      </div>

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

export default InvoicePreview;