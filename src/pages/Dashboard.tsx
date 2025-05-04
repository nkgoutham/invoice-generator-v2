import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useClientStore } from '../store/clientStore';
import { useCurrencyStore } from '../store/currencyStore';
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
  TrendingUp,
  Calendar,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import CurrencyToggle from '../components/dashboard/CurrencyToggle';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

// Chart data point type
type RevenueDataPoint = {
  month: string;
  year: number;
  amount: number;
  name: string; // for recharts
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { clients, fetchClients } = useClientStore();
  const { currencySettings, fetchCurrencySettings, convertCurrency } = useCurrencyStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // Stats for the dashboard
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [clientRevenueData, setClientRevenueData] = useState<any[]>([]);
  
  // Date range for chart
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 11);
    return date;
  });
  
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<string>("12");
  
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsLoading(true);
        await Promise.all([
          fetchInvoices(user.id),
          fetchClients(user.id),
          fetchCurrencySettings(user.id)
        ]);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, fetchInvoices, fetchClients, fetchCurrencySettings]);
  
  useEffect(() => {
    if (!isLoading) {
      // Calculate dashboard stats
      const totalClients = clients.length;
      
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
      const partiallyPaidInvoices = invoices.filter(inv => inv.status === 'partially_paid').length;
      const sentInvoices = invoices.filter(inv => inv.status === 'sent').length;
      const draftInvoices = invoices.filter(inv => inv.status === 'draft').length;
      
      // Calculate the breakdown description
      const statusBreakdown = [];
      if (paidInvoices > 0) statusBreakdown.push(`${paidInvoices} paid`);
      if (sentInvoices > 0) statusBreakdown.push(`${sentInvoices} sent`);
      if (overdueInvoices > 0) statusBreakdown.push(`${overdueInvoices} overdue`);
      if (partiallyPaidInvoices > 0) statusBreakdown.push(`${partiallyPaidInvoices} partial`);
      if (draftInvoices > 0) statusBreakdown.push(`${draftInvoices} draft`);
      
      const statusDescription = statusBreakdown.join(', ') || 'No invoices';
      
      const totalRevenue = calculateTotalRevenue(invoices.filter(inv => inv.status === 'paid')); 
      const pendingRevenue = calculateTotalRevenue([
        ...invoices.filter(inv => ['sent', 'overdue'].includes(inv.status)),
        ...invoices.filter(inv => inv.status === 'partially_paid').map(inv => ({
          ...inv,
          total: inv.total - (inv.partially_paid_amount || 0)
        }))
      ]);

      const preferredCurrency = currencySettings?.preferred_currency || 'INR';

      // Format revenue based on preferred currency
      const formatRevenueDisplay = (revenue: { inrAmount: number, usdAmount: number }) => {
        if (preferredCurrency === 'USD') {
          // Convert INR to USD if needed and add to USD amount
          const convertedInr = convertCurrency(revenue.inrAmount, 'INR', 'USD');
          const totalUsd = revenue.usdAmount + convertedInr;
          return formatCurrency(totalUsd, 'USD');
        } else {
          // Convert USD to INR if needed and add to INR amount
          const convertedUsd = convertCurrency(revenue.usdAmount, 'USD', 'INR');
          const totalInr = revenue.inrAmount + convertedUsd;
          return formatCurrency(totalInr, 'INR');
        }
      };

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
          description: statusDescription,
          icon: <FileText className="h-5 w-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          iconBg: 'bg-purple-100'
        },
        {
          title: 'Total Paid',
          value: formatRevenueDisplay(totalRevenue),
          description: 'Total revenue received',
          icon: <Wallet className="h-5 w-5" />,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          iconBg: 'bg-emerald-100'
        },
        {
          title: 'Pending Revenue',
          value: formatRevenueDisplay(pendingRevenue),
          description: 'Awaiting payment',
          icon: <CreditCard className="h-5 w-5" />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          iconBg: 'bg-amber-100'
        },
      ];
      
      setStats(newStats);
      
      // Generate monthly revenue data for chart
      generateRevenueChartData();
      
      // Generate client revenue data
      generateClientRevenueData();
    }
  }, [isLoading, clients, invoices, currencySettings, convertCurrency, startDate, endDate]);

  // Generate revenue chart data from invoices
  const generateRevenueChartData = () => {
    const paidInvoices = invoices.filter(inv => 
      (inv.status === 'paid' || inv.status === 'partially_paid') && 
      inv.payment_date
    );
    
    // Create date range from start to end date (based on selected time range)
    const months: RevenueDataPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'short' });
      
      months.push({
        month: monthName,
        year,
        amount: 0,
        name: `${monthName} ${year}` // for recharts
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Calculate revenue for each month
    paidInvoices.forEach(invoice => {
      if (!invoice.payment_date) return;
      
      const paymentDate = new Date(invoice.payment_date);
      
      // Skip if the payment date is outside our range
      if (paymentDate < startDate || paymentDate > endDate) return;
      
      const year = paymentDate.getFullYear();
      const month = paymentDate.getMonth();
      const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'short' });
      
      // Find the corresponding month in our array
      const monthIndex = months.findIndex(m => 
        m.month === monthName && m.year === year
      );
      
      if (monthIndex !== -1) {
        const amount = invoice.status === 'partially_paid' 
          ? invoice.partially_paid_amount || 0
          : invoice.total || 0;
        
        // Convert to preferred currency if needed
        let convertedAmount = amount;
        if (invoice.currency !== currencySettings?.preferred_currency) {
          convertedAmount = convertCurrency(
            amount, 
            invoice.currency as 'USD' | 'INR', 
            (currencySettings?.preferred_currency || 'INR') as 'USD' | 'INR'
          );
        }
        
        months[monthIndex].amount += convertedAmount;
      }
    });
    
    setRevenueData(months);
  };
  
  // Generate client revenue data
  const generateClientRevenueData = () => {
    const paidInvoices = invoices.filter(inv => 
      inv.status === 'paid' || inv.status === 'partially_paid'
    );
    
    // Create a map to hold client totals
    const clientMap = new Map<string, { 
      client_id: string, 
      client_name: string, 
      total: number
    }>();
    
    // Calculate overall total for percentage calculation
    let overallTotal = 0;
    
    paidInvoices.forEach(invoice => {
      const clientId = invoice.client_id;
      // @ts-ignore - client data is nested in the response
      const clientName = invoice.clients?.company_name || invoice.clients?.name || 'Unknown Client';
      
      // Get amount (use partially_paid_amount if available, otherwise total)
      const amount = invoice.status === 'partially_paid' && invoice.partially_paid_amount !== undefined
        ? invoice.partially_paid_amount
        : invoice.total;
      
      // Convert to preferred currency if needed
      let convertedAmount = amount;
      if (invoice.currency !== currencySettings?.preferred_currency) {
        convertedAmount = convertCurrency(
          amount, 
          invoice.currency as 'USD' | 'INR', 
          (currencySettings?.preferred_currency || 'INR') as 'USD' | 'INR'
        );
      }
      
      overallTotal += convertedAmount;
      
      // Initialize client in map if it doesn't exist
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, { 
          client_id: clientId, 
          client_name: clientName, 
          total: 0
        });
      }
      
      // Update client totals
      const clientData = clientMap.get(clientId)!;
      clientData.total += convertedAmount;
    });
    
    // Calculate percentages and format the data
    const clientData = Array.from(clientMap.values())
      .map(client => ({
        ...client,
        percentage: overallTotal > 0
          ? Math.round((client.total / overallTotal) * 100)
          : 0,
        formattedAmount: formatCurrency(
          client.total, 
          currencySettings?.preferred_currency || 'INR'
        )
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Get top 5 clients
    
    setClientRevenueData(clientData);
  };

  // Function to calculate total revenue with currency conversion
  const calculateTotalRevenue = (invoiceList: any[]) => {
    let inrAmount = 0;
    let usdAmount = 0;

    for (const inv of invoiceList) {
      if (inv.status === 'partially_paid' && inv.partially_paid_amount !== undefined) {
        // For partially paid invoices, use the paid amount
        if (inv.currency === 'USD') {
          usdAmount += inv.partially_paid_amount;
        } else {
          inrAmount += inv.partially_paid_amount;
        }
      } else {
        // For fully paid invoices, use the total amount
        if (inv.currency === 'USD') {
          usdAmount += inv.total;
        } else {
          inrAmount += inv.total;
        }
      }
    }

    return { inrAmount, usdAmount };
  };
  
  // Get the most recent invoices (top 3)
  const recentInvoices = [...(invoices || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Get recent payments (top 3)
  const recentPayments = [...(invoices || [])]
    .filter(inv => inv.status === 'paid' || inv.status === 'partially_paid')
    .sort((a, b) => {
      const dateA = new Date(a.payment_date || a.created_at);
      const dateB = new Date(b.payment_date || b.created_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);
  
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
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    
    const endDate = new Date();
    const startDate = new Date();
    const months = parseInt(range);
    startDate.setMonth(endDate.getMonth() - (months - 1));
    
    setStartDate(startDate);
    setEndDate(endDate);
  };

  // Custom tooltip for the revenue chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg border border-gray-200/80 rounded-lg">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-accent-600 text-sm font-medium">
            {formatCurrency(payload[0].value, currencySettings?.preferred_currency || 'INR')}
          </p>
        </div>
      );
    }
  
    return null;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader h-12 w-12"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Dashboard</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <Link
            to="/invoices/new"
            className="w-full sm:w-auto btn btn-primary btn-md"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
          <Link
            to="/clients/new"
            className="w-full sm:w-auto btn btn-secondary btn-md"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Client
          </Link>
        </div>
      </div>
      
      {/* Currency Toggle */}
      <div className="flex justify-end">
        <CurrencyToggle />
      </div>
      
      {/* Stats grid - Improved for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col h-full card hover:shadow-hover group transition-all duration-300 overflow-hidden">
            <div className="flex-1 p-4 sm:p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-xl p-3 ${stat.iconBg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <div className="ml-4 flex-1 min-w-0 space-y-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-neutral-500 truncate">
                      {stat.title}
                    </dt>
                    <dd>
                      <div className="text-base sm:text-lg font-medium text-neutral-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className={`${stat.bgColor} px-4 py-3 border-t border-gray-100/50 transition-colors duration-300`}>
              <div className="text-sm text-neutral-600 truncate">
                {stat.description}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Revenue Chart */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">Revenue Trend</h2>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500 hidden sm:block">
              {startDate.toLocaleString('default', { month: 'short', year: 'numeric' })} - 
              {endDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
            </div>
            
            <select 
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
            >
              <option value="12">Last 12 months</option>
              <option value="6">Last 6 months</option>
              <option value="3">Last 3 months</option>
              <option value="24">Last 24 months</option>
            </select>
          </div>
        </div>
        
        <div className="h-60 w-full">
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => {
                    const currency = currencySettings?.preferred_currency || 'INR';
                    return `${currency === 'INR' ? '₹' : '$'}${value}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5090f0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5090f0" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#5090f0" 
                  strokeWidth={2}
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#5090f0' }}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <p className="text-gray-500">No revenue data available for this period</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Recent invoices */}
        <div className="card overflow-hidden">
          <div className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-base sm:text-lg font-medium text-neutral-900 mb-2 sm:mb-0">Recent Invoices</h2>
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
                      <div className="px-4 py-3 sm:px-6 sm:py-4">
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
            {recentInvoices.length > 0 && (
              <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 text-center">
                <Link
                  to="/invoices"
                  className="text-sm text-accent-500 hover:text-accent-600 inline-flex items-center justify-center transition-all duration-200 hover:translate-x-0.5"
                >
                  View all invoices
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent payments */}
        <div className="card overflow-hidden">
          <div className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-base sm:text-lg font-medium text-neutral-900 mb-2 sm:mb-0">Recent Payments</h2>
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
              {recentPayments.length > 0 ? (
                recentPayments.map((invoice) => (
                  <li key={invoice.id} className="group">
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="block hover:bg-neutral-50 transition-colors duration-200"
                    >
                      <div className="px-4 py-3 sm:px-6 sm:py-4">
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
            {recentPayments.length > 0 && (
              <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 text-center">
                <Link
                  to="/invoices"
                  className="text-sm text-accent-500 hover:text-accent-600 inline-flex items-center justify-center transition-all duration-200 hover:translate-x-0.5"
                >
                  View all payments
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Top Clients by Revenue */}
      <div className="card overflow-hidden">
        <div className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h2 className="text-base sm:text-lg font-medium text-neutral-900 mb-2 sm:mb-0">Top Clients by Revenue</h2>
          <Link
            to="/earnings"
            className="text-sm font-medium text-accent-500 hover:text-accent-600 inline-flex items-center transition-all duration-200 hover:translate-x-0.5"
          >
            View full report
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="border-t border-neutral-200/80">
          {clientRevenueData.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientRevenueData.map((client, index) => (
                    <tr key={client.client_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {client.formattedAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        <div className="flex items-center justify-end">
                          <span className="mr-2">{client.percentage}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-accent-500 h-2.5 rounded-full" 
                              style={{ width: `${client.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-5 text-center text-sm text-neutral-500">
              No revenue data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;