import { useRef } from 'react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { InvoicePreviewData } from '../../types/invoice';
import { transformInvoiceData } from '../../utils/invoiceDataTransform';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface InvoicePreviewContentProps {
  data: InvoicePreviewData;
  allowDownload?: boolean;
}

const InvoicePreviewContent: React.FC<InvoicePreviewContentProps> = ({
  data: rawData,
  allowDownload = true
}) => {
  // Transform data based on engagement type to ensure consistent display
  const data = transformInvoiceData(rawData);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const currencySymbol = data.invoice.currency === 'USD' ? '$' : '₹';
  const primaryColor = data.issuer.primary_color || '#3B82F6';
  const secondaryColor = data.issuer.secondary_color || '#0EA5E9';

  // Get payment status badge color
  const getPaymentStatusColor = () => {
    if (data.invoice.status === 'paid') return 'bg-green-100 text-green-800 border-green-200';
    if (data.invoice.status === 'partially_paid') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (data.invoice.status === 'overdue') return 'bg-red-100 text-red-800 border-red-200';
    if (data.invoice.status === 'sent') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusText = () => {
    if (data.invoice.status === 'paid') return 'Paid';
    if (data.invoice.status === 'partially_paid') return 'Partially Paid';
    if (data.invoice.status === 'overdue') return 'Overdue';
    if (data.invoice.status === 'sent') return 'Pending Payment';
    if (data.invoice.status === 'draft') return 'Draft';
    return '';
  };

  const getPaymentMethodText = (method: string | undefined) => {
    if (!method) return '';
    
    const methods: Record<string, string> = {
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash',
      'cheque': 'Cheque',
      'upi': 'UPI',
      'other': 'Other'
    };
    
    return methods[method] || 'Other';
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const invoiceClone = invoiceRef.current.cloneNode(true) as HTMLElement;
      invoiceClone.classList.add('pdf-mode');
      
      // Temporarily append to the document but hide it
      invoiceClone.style.position = 'absolute';
      invoiceClone.style.left = '-9999px';
      invoiceClone.style.width = '1024px'; // Force desktop width
      document.body.appendChild(invoiceClone);
      
      // Find and remove the download button from the clone
      const downloadButton = invoiceClone.querySelector('.pdf-hidden');
      if (downloadButton) {
        downloadButton.remove();
      }
      
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
    }
  };

  return (
    <div className="bg-white min-h-full relative overflow-hidden pdf-ready" ref={invoiceRef}>
      {/* Background abstract shapes for a modern look */}
      <div 
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 hidden sm:block print:block pdf-force-show"
        style={{ backgroundColor: primaryColor }}
      ></div>
      <div 
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10 hidden sm:block print:block pdf-force-show"
        style={{ backgroundColor: secondaryColor }}
      ></div>
      
      {allowDownload && (
        <div className="absolute top-4 right-4 z-10 print:hidden pdf-hidden">
          <button
            onClick={handleDownloadPDF}
            className="bg-white rounded-md shadow-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      )}
      
      <div className="p-6 sm:p-8 md:p-10 max-w-5xl mx-auto relative z-10">
        {/* Header Section with company info and invoice number */}
        <div 
          className="flex flex-col md:flex-row print:flex-row justify-between items-start md:items-center print:items-center border-b pb-6 md:pb-8 mb-8"
          style={{ borderColor: `${primaryColor}40` }}
        >
          <div className="flex items-start space-x-4">
            {data.issuer.logo_url ? (
              <div className="w-16 h-16 md:w-20 md:h-20 print:w-20 print:h-20 rounded-xl shadow-lg overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-300 print:shadow-none">
                <img 
                  src={data.issuer.logo_url} 
                  alt="Company Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div 
                className="w-16 h-16 md:w-20 md:h-20 print:w-20 print:h-20 rounded-xl shadow-lg flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300 print:shadow-none"
                style={{ 
                  backgroundColor: `${primaryColor}15`,
                  border: `2px solid ${primaryColor}30`
                }}
              >
                <span 
                  className="text-2xl md:text-3xl print:text-3xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {data.issuer.business_name?.charAt(0) || 'B'}
                </span>
              </div>
            )}
            
            <div className="pt-1">
              <h1 
                className="text-2xl md:text-3xl print:text-3xl font-bold tracking-tight"
                style={{ color: primaryColor }}
              >
                {data.issuer.business_name}
              </h1>
              
              {data.issuer.address && (
                <p className="text-gray-600 mt-2 text-sm whitespace-pre-line leading-relaxed">
                  {data.issuer.address}
                </p>
              )}
              
              <div className="mt-2 space-y-2">
                {data.issuer.phone && (
                  <div className="inline-flex items-center text-gray-600 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="leading-none">{data.issuer.phone}</span>
                  </div>
                )}
                
                {data.issuer.pan_number && (
                  <div className="inline-flex items-center text-gray-600 text-sm ml-0 md:ml-3 print:ml-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="leading-none">PAN: {data.issuer.pan_number}</span>
                  </div>
                )}
                
                {data.issuer.gstin && (
                  <div className="inline-flex items-center text-gray-600 text-sm ml-0 md:ml-3 print:ml-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="leading-none">GSTIN: {data.issuer.gstin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right mt-6 md:mt-0 print:mt-0">
            <div className="inline-block relative">
              <div 
                className="absolute -right-5 -top-5 -z-10 w-24 h-24 rounded-full opacity-20 hidden sm:block print:block pdf-force-show"
                style={{ backgroundColor: secondaryColor }}
              ></div>
              <div 
                className="absolute -right-3 -top-3 -z-10 w-20 h-20 rounded-full opacity-30 hidden sm:block print:block pdf-force-show"
                style={{ backgroundColor: primaryColor }}
              ></div>
              
              <h2 
                className="text-3xl md:text-4xl print:text-4xl font-black uppercase tracking-wide"
                style={{ 
                  color: primaryColor,
                  textShadow: `1px 1px 0 ${secondaryColor}40`
                }}
              >
                INVOICE
              </h2>
            </div>
            
            <div 
              className="mt-3 px-4 py-3 rounded-lg shadow-md backdrop-blur-sm print:shadow-none"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: `1px solid ${primaryColor}20`
              }}
            >
              <p 
                className="text-gray-700 font-medium text-lg md:text-xl print:text-xl mb-3"
                style={{ color: primaryColor }}
              >
                #{data.invoice.invoice_number}
              </p>
              
              <div className="flex flex-col text-sm text-gray-600 space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium text-right pr-2">Date:</span>
                  <span className="text-left">{formatDate(data.invoice.issue_date)}</span>
                  
                  <span className="font-medium text-right pr-2 text-red-700">Due Date:</span>
                  <span className="text-left">{formatDate(data.invoice.due_date)}</span>
                </div>
              </div>
              
              {data.invoice.status && data.invoice.status !== 'draft' && (
                <div className="mt-3">
                  <span 
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor()}`}
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  >
                    {getPaymentStatusText()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Client and Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 my-8">
          {/* Client Information */}
          <div 
            className="rounded-xl p-5 backdrop-blur-sm relative overflow-hidden"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${primaryColor}20`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <div 
              className="absolute top-0 left-0 h-full w-1.5 rounded-l-xl"
              style={{ backgroundColor: primaryColor }}
            ></div>
            
            <div className="relative">
              <h3 
                className="text-sm uppercase font-bold tracking-wider mb-3"
                style={{ color: primaryColor }}
              >
                Bill To
              </h3>
              
              <p className="font-bold text-gray-900 text-lg">{data.client.name}</p>
              
              {data.client.company_name && (
                <p className="text-gray-700 font-medium">{data.client.company_name}</p>
              )}
              
              <div className="mt-3 space-y-3 text-gray-600">
                {data.client.billing_address && (
                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {data.client.billing_address}
                  </p>
                )}
                
                <div className="space-y-1.5 mt-2">
                  {data.client.email && (
                    <div className="flex items-center text-sm">
                      <span className="inline-flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span>{data.client.email}</span>
                    </div>
                  )}
                  
                  {data.client.phone && (
                    <div className="flex items-center text-sm">
                      <span className="inline-flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </span>
                      <span>{data.client.phone}</span>
                    </div>
                  )}
                  
                  {data.client.gst_number && (
                    <div className="flex items-center text-sm">
                      <span className="inline-flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      <span>GST: {data.client.gst_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Details */}
          <div 
            className="rounded-xl p-5 backdrop-blur-sm relative overflow-hidden"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${secondaryColor}20`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <div 
              className="absolute top-0 left-0 h-full w-1.5 rounded-l-xl"
              style={{ backgroundColor: secondaryColor }}
            ></div>
            
            <div className="relative">
              <h3 
                className="text-sm uppercase font-bold tracking-wider mb-3"
                style={{ color: secondaryColor }}
              >
                Payment Details
              </h3>
              
              <p className="font-medium text-gray-800">Bank Transfer</p>
              
              {data.banking && (
                <div className="text-gray-600 text-sm mt-3">
                  <div className="grid grid-cols-5 gap-1">
                    <span className="col-span-2 font-medium text-gray-700">Account:</span>
                    <span className="col-span-3">{data.banking.account_holder}</span>
                    
                    <span className="col-span-2 font-medium text-gray-700">Number:</span>
                    <span className="col-span-3">{data.banking.account_number}</span>
                    
                    <span className="col-span-2 font-medium text-gray-700">Bank:</span>
                    <span className="col-span-3">{data.banking.bank_name}</span>
                    
                    <span className="col-span-2 font-medium text-gray-700">IFSC:</span>
                    <span className="col-span-3">{data.banking.ifsc_code}</span>
                    
                    {data.banking.branch && (
                      <>
                        <span className="col-span-2 font-medium text-gray-700">Branch:</span>
                        <span className="col-span-3">{data.banking.branch}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Payment Received Information */}
              {(data.invoice.status === 'paid' || data.invoice.status === 'partially_paid') && (
                <div 
                  className="mt-4 pt-3 border-t"
                  style={{ borderColor: `${primaryColor}30` }}
                >
                  <h3 
                    className="text-sm uppercase font-bold tracking-wider text-green-600 mb-2 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Payment Received
                  </h3>
                  
                  <div className="text-gray-600 text-sm grid grid-cols-5 gap-1">
                    {data.invoice.payment_date && (
                      <>
                        <span className="col-span-2 font-medium text-gray-700">Date:</span>
                        <span className="col-span-3">{formatDate(data.invoice.payment_date)}</span>
                      </>
                    )}
                    
                    {data.invoice.payment_method && (
                      <>
                        <span className="col-span-2 font-medium text-gray-700">Method:</span>
                        <span className="col-span-3">{getPaymentMethodText(data.invoice.payment_method)}</span>
                      </>
                    )}
                    
                    {data.invoice.payment_reference && (
                      <>
                        <span className="col-span-2 font-medium text-gray-700">Reference:</span>
                        <span className="col-span-3">{data.invoice.payment_reference}</span>
                      </>
                    )}
                    
                    {data.invoice.status === 'partially_paid' && data.invoice.partially_paid_amount !== undefined && (
                      <>
                        <span className="col-span-2 font-medium text-gray-700">Paid:</span>
                        <span className="col-span-3 text-green-600 font-medium">
                          {formatCurrency(data.invoice.partially_paid_amount, data.invoice.currency)}
                        </span>
                        
                        <span className="col-span-2 font-medium text-gray-700">Balance:</span>
                        <span className="col-span-3">
                          {formatCurrency(data.invoice.total - data.invoice.partially_paid_amount, data.invoice.currency)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Invoice Items Table */}
        <div className="mt-10">
          <div 
            className="rounded-xl overflow-hidden border shadow-lg print:shadow-none"
            style={{ 
              borderColor: `${primaryColor}30`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.08), 0 1px 2px ${primaryColor}10, 0 -1px 0 ${secondaryColor}10`
            }}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead 
                className="text-left text-sm text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <tr>
                  {data.invoice.engagement_type !== 'milestone' && (
                    <>
                      <th className="py-4 px-4 font-semibold" style={{ width: '50%' }}>Description</th>
                      <th className="py-4 px-4 font-semibold text-right" style={{ width: '15%' }}>Quantity</th>
                      <th className="py-4 px-4 font-semibold text-right" style={{ width: '15%' }}>Rate</th>
                      <th className="py-4 px-4 font-semibold text-right" style={{ width: '20%' }}>Amount</th>
                    </>
                  )}
                  
                  {data.invoice.engagement_type === 'milestone' && (
                    <>
                      <th className="py-4 px-4 font-semibold" style={{ width: '70%' }}>Milestone</th>
                      <th className="py-4 px-4 font-semibold text-right" style={{ width: '30%' }}>Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200 text-sm">
                {data.invoice.engagement_type === 'milestone' && data.invoice.milestones ? (
                  data.invoice.milestones.map((milestone, index) => (
                    <tr 
                      key={index}
                      className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                      style={{ transition: 'all 0.2s ease' }}
                    >
                      <td className="py-4 px-4 text-gray-800">{milestone.name}</td>
                      <td className="py-4 px-4 text-right text-gray-800 font-medium">
                        {formatCurrency(milestone.amount, data.invoice.currency)}
                      </td>
                    </tr>
                  ))
                ) : data.invoice.items ? (
                  data.invoice.items.map((item, index) => (
                    <tr 
                      key={index}
                      className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                      style={{ transition: 'all 0.2s ease' }}
                    >
                      <td className="py-4 px-4 text-gray-800">{item.description}</td>
                      <td className="py-4 px-4 text-right text-gray-700">{item.quantity}</td>
                      <td className="py-4 px-4 text-right text-gray-700">
                        {formatCurrency(item.rate, data.invoice.currency)}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-800 font-medium">
                        {formatCurrency(item.amount, data.invoice.currency)}
                      </td>
                    </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>
          
          {/* Invoice Totals */}
          <div 
            className="mt-1 rounded-b-xl overflow-hidden shadow-lg backdrop-blur-sm print:shadow-none"
            style={{ 
              border: `1px solid ${primaryColor}20`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.05), 0 1px 3px ${primaryColor}10`,
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <div 
              className="flex justify-between p-4 border-b text-sm"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <span className="text-gray-600 font-medium">Subtotal:</span>
              <span className="text-gray-800 font-medium">
                {formatCurrency(data.invoice.subtotal, data.invoice.currency)}
              </span>
            </div>
            
            {/* GST or Tax */}
            {(data.invoice.is_gst_registered || data.invoice.tax_percentage > 0) && (
              <div 
                className="flex justify-between p-4 border-b text-sm"
                style={{ borderColor: `${primaryColor}20` }}
              >
                <span className="text-gray-600 font-medium">
                  {data.invoice.is_gst_registered 
                    ? `GST (${data.invoice.gst_rate || data.invoice.tax_percentage}%)` 
                    : data.invoice.tax_name 
                      ? `${data.invoice.tax_name} (${data.invoice.tax_percentage}%)` 
                      : `Tax (${data.invoice.tax_percentage}%)`}:
                </span>
                <span className="text-gray-800 font-medium">
                  {formatCurrency(data.invoice.gst_amount || data.invoice.tax, data.invoice.currency)}
                </span>
              </div>
            )}
            
            {/* Total */}
            <div 
              className="flex justify-between p-4"
              style={{ backgroundColor: `${primaryColor}08` }}
            >
              <span className="text-base text-gray-800 font-bold">Total:</span>
              <span 
                className="text-base font-bold"
                style={{ color: primaryColor }}
              >
                {formatCurrency(data.invoice.total, data.invoice.currency)}
              </span>
            </div>
            
            {/* TDS Section */}
            {data.invoice.is_tds_applicable && (
              <>
                <div 
                  className="flex justify-between p-4 border-t text-sm"
                  style={{ borderColor: `${primaryColor}20` }}
                >
                  <span className="text-red-600 font-medium">
                    TDS Deduction ({data.invoice.tds_rate || 10}%):
                  </span>
                  <span className="text-red-600 font-medium">
                    - {formatCurrency(data.invoice.tds_amount || 0, data.invoice.currency)}
                  </span>
                </div>
                
                <div 
                  className="flex justify-between p-4 border-t text-sm bg-green-50"
                  style={{ borderColor: `${primaryColor}20` }}
                >
                  <span className="text-base text-gray-800 font-bold">Amount Payable:</span>
                  <span className="text-base font-bold text-green-600">
                    {formatCurrency(data.invoice.amount_payable || data.invoice.total, data.invoice.currency)}
                  </span>
                </div>
                
                <div className="p-3 bg-gray-50 text-xs text-gray-500 italic text-center">
                  * TDS will be deducted by the client at the time of payment
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Notes Section */}
        {data.invoice.notes && (
          <div 
            className="mt-8 p-5 rounded-xl"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${primaryColor}20`,
              boxShadow: `0 4px 15px rgba(0,0,0,0.03), 0 1px 2px ${primaryColor}10`
            }}
          >
            <h3 
              className="font-semibold mb-2 flex items-center"
              style={{ color: primaryColor }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Notes
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{data.invoice.notes}</p>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 text-center">
          <div 
            className="p-4 border-t"
            style={{ borderColor: primaryColor }}
          >
            <p 
              className="text-sm text-gray-500 relative"
              style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
            >
              {data.issuer.footer_text || 'Thank you for your business!'}
            </p>
            
            {/* Watermark effect for print only */}
            <div 
              className="hidden print:block absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            >
              <div className="transform rotate-45 text-8xl font-black text-gray-500">
                {data.invoice.status === 'paid' ? 'PAID' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewContent;