import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useClientStore } from '../store/clientStore';
import { 
  CreditCard, 
  Users, 
  Clock,
  AlertCircle, 
  CheckCircle, 
  PlusCircle,
  ArrowRight,
  FileText,
  DollarSign,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

// Dashboard stats type
type DashboardStat = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  iconBg: string;
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { clients, fetchClients } = useClientStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // Stats for the dashboard
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsLoading(true);
        await Promise.all([
          fetchInvoices(user.id),
          fetchClients(user.id)
        ]);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, fetchInvoices, fetchClients]);
  
  useEffect(() => {
    if (!isLoading) {
      // Calculate dashboard stats
      const totalClients = clients.length;
      
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
      const partiallyPaidInvoices = invoices.filter(inv => inv.status === 'partially_paid').length;
      
      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);
      
      const pendingRevenue = invoices
        .filter(inv => ['sent', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + inv.total, 0);

      const partialRevenue = invoices
        .filter(inv => inv.status === 'partially_paid')
        .reduce((sum, inv) => {
          const remainingAmount = inv.total - (inv.partially_paid_amount || 0);
          return sum + remainingAmount;
        }, 0);

      const totalPending = pendingRevenue + partialRevenue;
      
      const newStats: DashboardStat[] = [
        {
          title: 'Total Clients',
          value: totalClients,
          description: 'Active client relationships',
          icon: <Users className="h-5 w-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          iconBg: 'bg-blue-100'
        },
        {
          title: 'Total Invoices',
          value: totalInvoices,
          description: `${paidInvoices} paid, ${overdueInvoices} overdue, ${partiallyPaidInvoices} partial`,
          icon: <FileText className="h-5 w-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          iconBg: 'bg-purple-100'
        },
        {
          title: 'Total Paid',
          value: formatCurrency(totalRevenue),
          description: 'Total revenue received',
          icon: <Wallet className="h-5 w-5" />,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          iconBg: 'bg-emerald-100'
        },
        {
          title: 'Pending Revenue',
          value: formatCurrency(totalPending),
          description: 'Awaiting payment',
          icon: <CreditCard className="h-5 w-5" />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          iconBg: 'bg-amber-100'
        },
      ];
      
      setStats(newStats);

      // Create recent activity feed by combining recent invoices and payments
      const activityItems = [];

      // Add recent invoices created
      for (const invoice of invoices.slice(0, 5)) {
        activityItems.push({
          type: 'invoice_created',
          date: invoice.created_at,
          invoice: invoice
        });
      }

      // Add recent payments
      for (const invoice of invoices.filter(inv => inv.payment_date).slice(0, 5)) {
        activityItems.push({
          type: 'payment_received',
          date: invoice.payment_date,
          invoice: invoice
        });
      }

      // Sort by date, most recent first
      activityItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setRecentActivity(activityItems.slice(0, 5));
    }
  }, [isLoading, clients, invoices]);
  
  const recentInvoices = [...(invoices || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentClients = [...(clients || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'sent':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'partially_paid':
        return <DollarSign className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-neutral-400" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader h-12 w-12"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-600 to-accent-500">
            Dashboard
          </span>
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <Link
            to="/invoices/new"
            className="btn btn-primary btn-md"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
          <Link
            to="/clients/new"
            className="btn btn-secondary btn-md"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Client
          </Link>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="card hover:shadow-hover group transition-all duration-300 overflow-hidden">
            <div className="p-4 sm:p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-2.5 ${stat.iconBg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-neutral-500 truncate">
                      {stat.title}
                    </dt>
                    <dd>
                      <div className="text-sm sm:text-lg font-medium text-neutral-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className={`${stat.bgColor} px-3 py-2 sm:px-5 sm:py-3 transition-colors duration-300`}>
              <div className="text-xs sm:text-sm text-neutral-600">
                {stat.description}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent invoices */}
        <div className="card overflow-hidden">
          <div className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-lg font-medium text-neutral-900 mb-2 sm:mb-0">Recent Invoices</h2>
            <Link
              to="/invoices"
              className="text-sm font-medium text-accent-500 hover:text-accent-600 inline-flex items-center transition-all duration-200 hover:translate-x-0.5"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="border-t border-neutral-200/80">
            <ul className="divide-y divide-neutral-200/80">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice) => (
                  <li key={invoice.id} className="group">
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="block hover:bg-neutral-50 transition-colors duration-200"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between flex-wrap gap-y-2">
                          <div className="flex items-center">
                            <div className="transform group-hover:scale-105 transition-transform duration-200">
                              {getStatusIcon(invoice.status)}
                            </div>
                            <span className="ml-2 text-sm font-medium text-neutral-900">
                              {invoice.invoice_number}
                            </span>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span
                              className={`badge ${
                                invoice.status === 'paid'
                                  ? 'badge-success'
                                  : invoice.status === 'overdue'
                                  ? 'badge-danger'
                                  : invoice.status === 'sent'
                                  ? 'badge-warning'
                                  : invoice.status === 'partially_paid'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'badge-neutral'
                              }`}
                            >
                              {invoice.status === 'partially_paid' 
                                ? 'Partially Paid' 
                                : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap justify-between items-center gap-y-2">
                          <div className="text-sm text-neutral-500 truncate">
                            {/* @ts-ignore */}
                            {invoice.clients?.company_name || invoice.clients?.name || 'Client'}
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="font-medium text-neutral-900">
                              {formatCurrency(invoice.total, invoice.currency)}
                            </span>
                            {invoice.status === 'partially_paid' && invoice.partially_paid_amount !== undefined && (
                              <span className="ml-1 text-xs text-emerald-600">
                                ({formatCurrency(invoice.partially_paid_amount, invoice.currency)} paid)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="px-4 py-5 text-center text-sm text-neutral-500">
                  No invoices yet. Create your first invoice!
                </li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Recent activity */}
        <div className="card overflow-hidden">
          <div className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-lg font-medium text-neutral-900 mb-2 sm:mb-0">Recent Payments</h2>
            <Link
              to="/invoices"
              className="text-sm font-medium text-accent-500 hover:text-accent-600 inline-flex items-center transition-all duration-200 hover:translate-x-0.5"
            >
              View all invoices
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="border-t border-neutral-200/80">
            <ul className="divide-y divide-neutral-200/80">
              {invoices.filter(inv => inv.status === 'paid' || inv.status === 'partially_paid').slice(0, 5).length > 0 ? (
                invoices
                  .filter(inv => inv.status === 'paid' || inv.status === 'partially_paid')
                  .sort((a, b) => {
                    const dateA = new Date(a.payment_date || a.created_at);
                    const dateB = new Date(b.payment_date || b.created_at);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .slice(0, 5)
                  .map((invoice) => (
                    <li key={invoice.id} className="group">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="block hover:bg-neutral-50 transition-colors duration-200"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2">
                            <div className="flex items-center mr-2">
                              <div className="mr-2 transform group-hover:scale-105 transition-transform duration-200 text-emerald-500">
                                <TrendingUp className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium text-neutral-900 truncate">
                                {invoice.status === 'partially_paid' ? 'Partial payment' : 'Payment received'} for #{invoice.invoice_number}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm text-neutral-500">
                              {formatDate(invoice.payment_date || invoice.created_at)}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap justify-between items-center gap-y-2">
                            <div className="text-sm text-neutral-500 truncate">
                              {/* @ts-ignore */}
                              {invoice.clients?.company_name || invoice.clients?.name || 'Client'}
                            </div>
                            <div className="font-medium text-sm text-emerald-600">
                              {invoice.status === 'partially_paid' && invoice.partially_paid_amount !== undefined
                                ? formatCurrency(invoice.partially_paid_amount, invoice.currency)
                                : formatCurrency(invoice.total, invoice.currency)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))
              ) : (
                <li className="px-4 py-5 text-center text-sm text-neutral-500">
                  No payments received yet.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;