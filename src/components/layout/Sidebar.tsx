import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  DollarSign,
  User,
  LogOut,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  mobile?: boolean;
  closeSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobile = false, closeSidebar }) => {
  const location = useLocation();
  const { signOut } = useAuthStore();

  const handleClick = () => {
    if (mobile && closeSidebar) {
      closeSidebar();
    }
  };
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: 'Invoices',
      path: '/invoices',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: 'Recurring',
      path: '/recurring',
      icon: <RefreshCw className="w-5 h-5" />,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <User className="w-5 h-5" />,
    },
    {
      name: 'Banking',
      path: '/banking',
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      name: 'Settings',
      path: '/settings/reminders',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex flex-col w-64 h-full bg-white border-r border-neutral-200/80">
      <div className="h-16 sm:h-18 flex items-center px-6 border-b border-neutral-200/80">
        <Link 
          to="/" 
          className="flex items-center space-x-2 font-semibold text-xl"
          onClick={handleClick}
        >
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-accent-500 to-accent-secondary-500 flex items-center justify-center text-white shadow-md">
            <FileText className="h-5 w-5" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-600 to-accent-secondary-600">
            InvoicePro
          </span>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto py-6 px-4">
        <nav className="flex-1 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`
                flex items-center px-3 py-2.5 text-sm font-medium rounded-lg 
                transition-all duration-200
                ${isActive(item.path)
                  ? 'text-accent-500 bg-accent-50 shadow-subtle'
                  : 'text-neutral-700 hover:text-accent-500 hover:bg-accent-50'
                }
              `}
              onClick={handleClick}
            >
              <span className={`mr-3 transition-transform duration-200 ${isActive(item.path) ? 'text-accent-500 scale-105' : 'text-neutral-500'}`}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="pt-6 mt-auto border-t border-neutral-200/80">
          <button
            onClick={() => {
              signOut();
              if (mobile && closeSidebar) closeSidebar();
            }}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg text-neutral-700 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;