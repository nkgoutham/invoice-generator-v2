import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useClientStore } from '../../store/clientStore';
import { 
  PlusCircle, 
  Search, 
  Users, 
  Filter,
  Building,
  Mail,
  Phone,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { Client } from '../../lib/supabase';
import { truncateText } from '../../utils/helpers';

const Clients = () => {
  const { user } = useAuthStore();
  const { clients, loading, error, fetchClients } = useClientStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchClients(user.id);
    }
  }, [user, fetchClients]);
  
  // Apply filters and search
  useEffect(() => {
    if (clients) {
      let result = [...clients];
      
      // Apply search
      if (searchTerm) {
        const lowercaseSearch = searchTerm.toLowerCase();
        result = result.filter(client => 
          client.name.toLowerCase().includes(lowercaseSearch) ||
          (client.company_name && client.company_name.toLowerCase().includes(lowercaseSearch)) ||
          (client.email && client.email.toLowerCase().includes(lowercaseSearch))
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        result = result.filter(client => client.status === statusFilter);
      }
      
      setFilteredClients(result);
    }
  }, [clients, searchTerm, statusFilter]);
  
  const statusColors: Record<string, string> = {
    active: 'badge-success',
    inactive: 'badge-neutral',
    prospect: 'badge-info',
  };

  // Engagement status mapping for more readable display
  const getEngagementStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'onboarding': 'New',
      'active': 'Active',
      'inactive': 'Inactive',
      'project': 'Project-based',
      'retainer': 'Retainer',
      'completed': 'Completed'
    };
    
    return statusMap[status] || 'Active';
  };
  
  const handleRefresh = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    await fetchClients(user.id);
    setTimeout(() => setIsRefreshing(false), 800); // Add a minimum delay for better UX
  };

  if (loading && !clients.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader h-12 w-12"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-600 to-accent-500">
            Clients
          </span>
        </h1>
        <Link
          to="/clients/new"
          className="btn btn-primary btn-md"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Link>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-fade-in">
          {error}
        </div>
      )}
      
      {/* Filters and search */}
      <div className="card mb-6">
        <div className="p-4 border-b border-neutral-200/70">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
              </div>
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Status filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
              </div>
              <select
                className="form-select pl-10"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
              </select>
            </div>
            
            {/* Client count */}
            <div className="flex items-center justify-start md:justify-end space-x-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-neutral-400 mr-2" />
                <span className="text-sm text-neutral-600">
                  {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <button 
                onClick={handleRefresh} 
                className="btn btn-secondary btn-sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="ml-1.5">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Clients grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 flex flex-col group"
            >
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-neutral-900 truncate max-w-[70%] group-hover:text-accent-600 transition-colors">
                    {client.name}
                  </h3>
                  <span
                    className={`badge ${
                      statusColors[client.status] || 'badge-neutral'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>
                
                {client.company_name && (
                  <div className="mt-3 flex items-center text-sm text-neutral-600">
                    <Building className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400" />
                    <span className="truncate">{client.company_name}</span>
                  </div>
                )}
                
                {client.email && (
                  <div className="mt-2 flex items-center text-sm text-neutral-600">
                    <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                
                {client.phone && (
                  <div className="mt-2 flex items-center text-sm text-neutral-600">
                    <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
                
                {client.billing_address && (
                  <div className="mt-3 text-sm text-neutral-600">
                    <p className="truncate">{truncateText(client.billing_address, 50)}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-neutral-50 px-5 py-3 mt-auto rounded-b-xl border-t border-neutral-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600">
                    Status: <span className="font-medium text-neutral-800">
                      {getEngagementStatusLabel(client.engagement_status)}
                    </span>
                  </span>
                  <span className="text-accent-600 font-medium flex items-center">
                    View details
                    <ArrowRight className="ml-1 h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" /> 
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center animate-fade-in">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <Users className="h-8 w-8" />
            </div>
          </div>
          <h3 className="mt-4 text-lg font-medium text-neutral-900">No clients found</h3>
          <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
            {clients.length > 0
              ? "No clients match your search criteria. Try adjusting your filters."
              : "Get started by adding your first client."}
          </p>
          {clients.length === 0 && (
            <div className="mt-6">
              <Link
                to="/clients/new"
                className="btn btn-primary btn-md"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Client
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Clients;