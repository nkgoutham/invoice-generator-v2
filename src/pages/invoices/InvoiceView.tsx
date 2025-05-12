import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useProfileStore } from '../../store/profileStore';
import { useClientStore } from '../../store/clientStore';
import { normalizeInvoiceData } from '../../utils/invoiceDataTransform';
import { InvoicePreviewData } from '../../types/invoice';
import InvoicePreviewContent from '../../components/invoices/InvoicePreviewContent';
import RecordPaymentModal from '../../components/invoices/RecordPaymentModal';
import toast from 'react-hot-toast';

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { selectedInvoice, invoiceItems, fetchInvoice, fetchInvoiceItems, recordPayment, loading } = useInvoiceStore();
  const { profile, bankingInfo, fetchProfile, fetchBankingInfo } = useProfileStore();
  const { getClient } = useClientStore();
  
  const [previewData, setPreviewData] = useState<InvoicePreviewData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [client, setClient] = useState<any>(null);
  
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
          onClick={() => handleDownloadPDF()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md text-sm font-medium"
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
  
  // Function to handle PDF download
  function handleDownloadPDF() {
    // This function is implemented in InvoicePreviewContent
    // The button in the UI will trigger the download
    const downloadButton = document.querySelector('.pdf-hidden button') as HTMLButtonElement;
    if (downloadButton) {
      downloadButton.click();
    }
  }
};

export default InvoiceView;