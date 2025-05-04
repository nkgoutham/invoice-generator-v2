import { Outlet, Link, useLocation } from 'react-router-dom';
import { Mail, DollarSign, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine which tab is active based on the current location
  const isRemindersActive = location.pathname.includes('/settings/reminders');
  const isCurrencyActive = location.pathname.includes('/settings/currency');
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
      </div>
      
      {/* Settings Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Settings sections">
          <Link
            to="/settings/reminders"
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${isRemindersActive
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email Reminders
          </Link>
          <Link
            to="/settings/currency"
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${isCurrencyActive
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Currency Settings
          </Link>
        </nav>
      </div>
      
      {/* Content Area */}
      <Outlet />
    </div>
  );
};

export default SettingsLayout;