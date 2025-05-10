import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useClientStore } from '../../store/clientStore';
import { useProfileStore } from '../../store/profileStore';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateDueDate, calculateInvoiceTotals } from '../../utils/helpers';
import { EngagementModel, Client } from '../../lib/supabase';
import { InvoiceFormData, InvoicePreviewData } from '../../types/invoice';
import { normalizeInvoiceData } from '../../utils/invoiceDataTransform';

// Import components
import InvoiceHeader from '../../components/invoices/InvoiceHeader';
import ServiceItems from '../../components/invoices/ServiceItems';
import RetainershipItem from '../../components/invoices/RetainershipItem';
import ProjectItem from '../../components/invoices/ProjectItem';
import MilestoneItems from '../../components/invoices/MilestoneItems';
import TaxSettings from '../../components/invoices/TaxSettings';
import InvoiceTotals from '../../components/invoices/InvoiceTotals';
import InvoiceNotes from '../../components/invoices/InvoiceNotes';
import ActionButtons from '../../components/invoices/ActionButtons';

// Use lazy loading for the modal components
const InvoicePreviewModal = lazy(() => 
  import('../../components/invoices/InvoicePreviewModal')
);

const RecordPaymentModal = lazy(() => 
  import('../../components/invoices/RecordPaymentModal')
);

const NewInvoice = () => {
  // ... [rest of the component code remains exactly the same]
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {editMode ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4 sm:mb-6">
          <InvoiceHeader
            register={register}
            errors={errors}
            clients={clients}
            clientEngagementModel={clientEngagementModel}
            watchClientId={watchClientId}
          />
          
          {renderItemsSection()}
          
          <TaxSettings 
            register={register} 
            control={control}
            updateTaxSettings={updateTaxSettings}
          />
          
          <InvoiceTotals
            subtotal={subtotal}
            tax={tax}
            total={total}
            selectedCurrency={selectedCurrency}
            taxPercentage={watchTaxPercentage}
          />
          
          <InvoiceNotes register={register} />
        </div>
        
        <ActionButtons 
          loading={loading} 
          onCancel={() => navigate('/invoices')} 
          showPreviewLink={true}
          onPreviewClick={handleOpenPreview}
        />
      </form>
      
      {previewOpen && previewData && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>}>
          <InvoicePreviewModal
            isOpen={previewOpen}
            onClose={handleClosePreview}
            data={previewData}
            onSave={handleSaveFromPreview}
            isSaving={isSavingFromPreview || loading}
            isUpdate={editMode}
          />
        </Suspense>
      )}
      
      {showPaymentModal && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>}>
          <RecordPaymentModal 
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSave={handleRecordPayment}
            invoice={{
              id: '',
              total: total,
              currency: watchCurrency,
              status: 'draft'
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default NewInvoice;