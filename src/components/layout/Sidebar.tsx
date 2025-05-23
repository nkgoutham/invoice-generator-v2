import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText,
  Receipt,
  DollarSign,
  User,
  LogOut,
  RefreshCw,
  Settings,
  TrendingUp,
  PlayCircle,
  Clock,
  CreditCard,
  BarChart2,
  Building
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

interface NavigationItem {
  name: string;
  path: string;
  icon: JSX.Element;
  onClick?: () => void;
}

interface SidebarProps {
  mobile?: boolean;
  closeSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobile = false, closeSidebar }) => {
  const location = useLocation();
  const { signOut } = useAuthStore();
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleClick = () => {
    if (mobile && closeSidebar) {
      closeSidebar();
    }
  };
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navigationItems: NavigationItem[] = [
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
      name: 'Earnings',
      path: '/earnings',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: <Receipt className="w-5 h-5" />,
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: <Users className="w-5 h-5" />,
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
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      name: 'Get Started',
      path: '',
      icon: <PlayCircle className="w-5 h-5" />,
      onClick: () => setShowVideoModal(true)
    },
  ];

  const handleNavItemClick = (item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
    }
    
    if (mobile && closeSidebar) {
      closeSidebar();
    }
  };

  return (
    <div className="flex flex-col w-64 h-full bg-white border-r border-neutral-200/80">
      <div className="h-16 sm:h-18 flex items-center px-6 border-b border-neutral-200/80">
        <Link 
          to="/" 
          className="flex items-center justify-center w-full"
          onClick={handleClick}
        >
          <img 
            src="/full_logo.png" 
            alt="InvoicePro Logo" 
            className="h-12 sm:h-14 object-contain"
          />
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto py-6 px-4">
        <nav className="flex-1 space-y-1">
          {navigationItems.map((item) => (
            item.onClick ? (
              <button
                key={item.name}
                className={`
                  w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg 
                  transition-all duration-200 text-neutral-700 hover:text-accent-500 hover:bg-accent-50
                `}
                onClick={() => handleNavItemClick(item)}
              >
                <span className="mr-3 text-neutral-500">
                  {item.icon}
                </span>
                {item.name}
              </button>
            ) : (
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
            )
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
      
      {/* Video Tutorial Modal */}
      {showVideoModal && (
        <div className="video-modal">
          <div className="video-modal-content">
            <div className="video-modal-close">
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="bg-white rounded-full p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none shadow-md"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How to Use Easy Invoice</h3>
              <div className="video-container">
                <iframe 
                  src="https://www.youtube.com/embed/OyU-B6TIOAM" 
                  title="Easy Invoice Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;