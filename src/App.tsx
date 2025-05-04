import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Components that are used immediately
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const BankingInfo = lazy(() => import('./pages/profile/BankingInfo'));
const Clients = lazy(() => import('./pages/clients/Clients'));
const ClientDetails = lazy(() => import('./pages/clients/ClientDetails'));
const NewClient = lazy(() => import('./pages/clients/NewClient'));
const EditClient = lazy(() => import('./pages/clients/EditClient'));
const Invoices = lazy(() => import('./pages/invoices/Invoices'));
const NewInvoice = lazy(() => import('./pages/invoices/NewInvoice'));
const PastInvoiceForm = lazy(() => import('./pages/invoices/PastInvoiceForm'));
const InvoiceDetails = lazy(() => import('./pages/invoices/InvoiceDetails'));
const InvoicePDF = lazy(() => import('./pages/invoices/InvoicePDF'));
const InvoicePreview = lazy(() => import('./pages/invoices/InvoicePreview'));
const Earnings = lazy(() => import('./pages/earnings/Earnings'));
const RecurringInvoices = lazy(() => import('./pages/recurring/RecurringInvoices'));
const NewRecurringInvoice = lazy(() => import('./pages/recurring/NewRecurringInvoice'));
const RecurringInvoiceDetails = lazy(() => import('./pages/recurring/RecurringInvoiceDetails'));
const InvoiceReminders = lazy(() => import('./pages/settings/InvoiceReminders'));
const CurrencySettings = lazy(() => import('./pages/settings/CurrencySettings'));
const SettingsLayout = lazy(() => import('./pages/settings/SettingsLayout'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component for suspense
const Loading = () => (
  <div className="flex items-center justify-center h-screen bg-neutral-50">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-t-3 border-b-3 border-accent-500 animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-white"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-4 w-4 rounded-full bg-accent-100 animate-pulse"></div>
      </div>
    </div>
  </div>
);

function App() {
  const { init, isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#374151',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={
              <Suspense fallback={<Loading />}>
                <Dashboard />
              </Suspense>
            } />
            
            <Route path="profile" element={
              <Suspense fallback={<Loading />}>
                <Profile />
              </Suspense>
            } />
            <Route path="banking" element={
              <Suspense fallback={<Loading />}>
                <BankingInfo />
              </Suspense>
            } />
            
            <Route path="clients" element={
              <Suspense fallback={<Loading />}>
                <Clients />
              </Suspense>
            } />
            <Route path="clients/new" element={
              <Suspense fallback={<Loading />}>
                <NewClient />
              </Suspense>
            } />
            <Route path="clients/:id" element={
              <Suspense fallback={<Loading />}>
                <ClientDetails />
              </Suspense>
            } />
            <Route path="clients/:id/edit" element={
              <Suspense fallback={<Loading />}>
                <EditClient />
              </Suspense>
            } />
            
            <Route path="invoices" element={
              <Suspense fallback={<Loading />}>
                <Invoices />
              </Suspense>
            } />
            <Route path="invoices/new" element={
              <Suspense fallback={<Loading />}>
                <NewInvoice />
              </Suspense>
            } />
            <Route path="past-invoice" element={
              <Suspense fallback={<Loading />}>
                <PastInvoiceForm />
              </Suspense>
            } />
            <Route path="invoices/:id" element={
              <Suspense fallback={<Loading />}>
                <InvoiceDetails />
              </Suspense>
            } />
            <Route path="invoices/:id/pdf" element={
              <Suspense fallback={<Loading />}>
                <InvoicePDF />
              </Suspense>
            } />
            <Route path="invoices/:id/preview" element={
              <Suspense fallback={<Loading />}>
                <InvoicePreview />
              </Suspense>
            } />
            <Route path="earnings" element={
              <Suspense fallback={<Loading />}>
                <Earnings />
              </Suspense>
            } />
            
            {/* Recurring Invoice Routes */}
            <Route path="recurring" element={
              <Suspense fallback={<Loading />}>
                <RecurringInvoices />
              </Suspense>
            } />
            <Route path="recurring/new" element={
              <Suspense fallback={<Loading />}>
                <NewRecurringInvoice />
              </Suspense>
            } />
            <Route path="recurring/:id" element={
              <Suspense fallback={<Loading />}>
                <RecurringInvoiceDetails />
              </Suspense>
            } />
            
            {/* Settings Routes */}
            <Route path="settings" element={
              <Suspense fallback={<Loading />}>
                <SettingsLayout />
              </Suspense>
            }>
              <Route index element={<Navigate to="reminders" replace />} />
              <Route path="reminders" element={
                <Suspense fallback={<Loading />}>
                  <InvoiceReminders />
                </Suspense>
              } />
              <Route path="currency" element={
                <Suspense fallback={<Loading />}>
                  <CurrencySettings />
                </Suspense>
              } />
            </Route>
          </Route>
          
          {/* 404 Not Found */}
          <Route path="*" element={
            <Suspense fallback={<Loading />}>
              <NotFound />
            </Suspense>
          } />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;