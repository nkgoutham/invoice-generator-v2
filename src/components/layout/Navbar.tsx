import { useNavigate } from 'react-router-dom';
import { Menu, User, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { useEffect, useState, useRef } from 'react';

interface NavbarProps {
  onMenuClick: () => void;
  isMobile?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, isMobile = false }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Get the first letter of the business name for avatar
  const getInitial = () => {
    if (profile?.business_name) {
      return profile.business_name.charAt(0).toUpperCase();
    }
    return 'E'; // Default fallback for easyinvoice
  };

  // Generate a color based on the business name
  const getAvatarColor = () => {
    if (!profile?.business_name) return { bg: 'bg-accent-100', text: 'text-accent-600' };
    
    // Simple hash function for the business name to generate consistent colors
    const hash = profile.business_name.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0), 0
    );
    
    const colorOptions = [
      { bg: 'bg-accent-100', text: 'text-accent-600' },
      { bg: 'bg-emerald-100', text: 'text-emerald-600' },
      { bg: 'bg-purple-100', text: 'text-purple-600' },
      { bg: 'bg-amber-100', text: 'text-amber-600' },
      { bg: 'bg-rose-100', text: 'text-rose-600' },
      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    ];
    
    return colorOptions[hash % colorOptions.length];
  };

  // Add timestamp to logo URL to prevent caching
  const getLogoUrl = () => {
    if (!profile?.logo_url) return null;
    
    const timestamp = new Date().getTime();
    return profile.logo_url.includes('?') 
      ? `${profile.logo_url}&t=${timestamp}` 
      : `${profile.logo_url}?t=${timestamp}`;
  };

  const avatarColor = getAvatarColor();
  const logoUrl = getLogoUrl();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 sm:h-18 px-4 sm:px-6 bg-white backdrop-blur-sm bg-opacity-90 border-b border-neutral-200/80 shadow-subtle transition-all duration-300">
      <div className="flex items-center">
        {isMobile && (
          <button
            type="button"
            className="p-2 rounded-lg text-neutral-500 hover:text-accent-500 hover:bg-accent-50 transition-all duration-200"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex items-center space-x-3 sm:space-x-5">
        <button
          type="button"
          className="p-1.5 rounded-full text-neutral-500 hover:text-accent-500 hover:bg-accent-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5 sm:h-5 sm:w-5" />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-transform duration-200 hover:scale-105"
            id="user-menu-button"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="sr-only">Open user menu</span>
            <div className={`h-9 w-9 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md
                ${logoError ? `${avatarColor.bg} ${avatarColor.text} font-bold` : ''}`}>
              {logoUrl && !logoError ? (
                // Display the uploaded logo with error handling
                <img
                  className="h-full w-full object-cover transition-opacity duration-200"
                  src={logoUrl}
                  alt="Profile"
                  loading="lazy"
                  onError={() => {
                    setLogoError(true);
                  }}
                />
              ) : (
                // Display a styled initial of the business name
                <div className={`h-full w-full ${avatarColor.bg} flex items-center justify-center ${avatarColor.text} font-bold`}>
                  {getInitial()}
                </div>
              )}
            </div>
          </button>

          {dropdownOpen && (
            <div
              className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-modal py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all duration-200 animate-scale"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
            >
              <div className="block px-4 py-3 text-sm border-b border-neutral-200/80">
                <p className="font-medium truncate text-neutral-800">{profile?.business_name || 'Your Business'}</p>
                <p className="text-neutral-500 truncate">{user?.email}</p>
              </div>
              <button
                className="block w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-150"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
                }}
              >
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-neutral-500" />
                  Your Profile
                </span>
              </button>
              <button
                className="block w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-150"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/banking');
                }}
              >
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                  </svg>
                  Banking Details
                </span>
              </button>
              <div className="border-t border-neutral-200/80 my-1"></div>
              <button
                className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                role="menuitem"
                onClick={() => {
                  handleSignOut();
                  setDropdownOpen(false);
                }}
              >
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Sign out
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;