import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/profile/Profile';
import BankingInfo from './pages/profile/BankingInfo';
import Clients from './pages/clients/Clients';
import ClientDetails from './pages/clients/ClientDetails';
import NewClient from './pages/clients/NewClient';
import EditClient from './pages/clients/EditClient';
import Invoices from './pages/invoices/Invoices';
import NewInvoice from './pages/invoices/NewInvoice';
import InvoiceDetails from './pages/invoices/InvoiceDetails';
import InvoicePDF from './pages/invoices/InvoicePDF';
import InvoicePreview from './pages/invoices/InvoicePreview';
import RecurringInvoices from './pages/recurring/RecurringInvoices';
import NewRecurringInvoice from './pages/recurring/NewRecurringInvoice';
import RecurringInvoiceDetails from './pages/recurring/RecurringInvoiceDetails';
import InvoiceReminders from './pages/settings/InvoiceReminders';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import NotFound from './pages/NotFound';

function App() {
  const { init, isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
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
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="profile" element={<Profile />} />
          <Route path="banking" element={<BankingInfo />} />
          
          <Route path="clients" element={<Clients />} />
          <Route path="clients/new" element={<NewClient />} />
          <Route path="clients/:id" element={<ClientDetails />} />
          <Route path="clients/:id/edit" element={<EditClient />} />
          
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<NewInvoice />} />
          <Route path="invoices/:id" element={<InvoiceDetails />} />
          <Route path="invoices/:id/pdf" element={<InvoicePDF />} />
          <Route path="invoices/:id/preview" element={<InvoicePreview />} />
          
          {/* New Recurring Invoice Routes */}
          <Route path="recurring" element={<RecurringInvoices />} />
          <Route path="recurring/new" element={<NewRecurringInvoice />} />
          <Route path="recurring/:id" element={<RecurringInvoiceDetails />} />
          
          {/* Settings Routes */}
          <Route path="settings/reminders" element={<InvoiceReminders />} />
        </Route>
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;