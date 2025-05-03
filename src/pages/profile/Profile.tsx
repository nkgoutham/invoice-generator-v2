import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { Save, Upload, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Profile as ProfileType } from '../../lib/supabase';

type ProfileFormData = Omit<ProfileType, 'id' | 'created_at' | 'user_id'>;

const Profile = () => {
  const { user } = useAuthStore();
  const { profile, loading, error, fetchProfile, updateProfile, uploadLogo } = useProfileStore();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>();
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Fetch profile on component mount and when user changes
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        await fetchProfile(user.id);
      }
    };
    
    loadProfile();
  }, [user, fetchProfile]);
  
  // Update form when profile data changes
  useEffect(() => {
    if (profile) {
      reset({
        business_name: profile.business_name,
        address: profile.address,
        pan_number: profile.pan_number,
        phone: profile.phone,
        logo_url: profile.logo_url,
        primary_color: profile.primary_color || '#3B82F6',
        secondary_color: profile.secondary_color || '#0EA5E9',
        footer_text: profile.footer_text,
      });
      
      if (profile.logo_url) {
        // Add timestamp to force image refresh
        const timestamp = new Date().getTime();
        const refreshedUrl = profile.logo_url.includes('?') 
          ? `${profile.logo_url}&t=${timestamp}` 
          : `${profile.logo_url}?t=${timestamp}`;
        setLogoPreview(refreshedUrl);
      } else {
        setLogoPreview(null);
      }
    }
  }, [profile, reset]);
  
  const validateLogo = (file: File) => {
    // Check file size - limit to 1MB
    if (file.size > 1024 * 1024) {
      setLogoError('Logo file must be smaller than 1MB');
      return false;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Logo must be an image (JPEG, PNG, GIF, or WEBP)');
      return false;
    }
    
    setLogoError(null);
    return true;
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!validateLogo(file)) {
        e.target.value = '';
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    try {
      // If there's a new logo, upload it first
      setIsLogoLoading(true);
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, user.id);
        if (!logoUrl) {
          throw new Error('Failed to upload logo');
        }
        
        // Logo URL is already updated in the database via uploadLogo function
        toast.success('Logo uploaded successfully');
        
        // Clear the file input to prevent re-uploading the same file
        setLogoFile(null);
        
        // The preview is already set, so we don't need to update it here
      }
      setIsLogoLoading(false);
      
      // Then update profile data if any other fields have changed
      if (isDirty) {
        await updateProfile({
          ...data,
          user_id: user.id,
        });
        
        toast.success('Profile updated successfully');
      }
      
      // Refresh the profile to ensure we have the latest data
      await fetchProfile(user.id);
    } catch (err: any) {
      setIsLogoLoading(false);
      toast.error(err.message || 'Failed to update profile');
    }
  };
  
  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-4 sm:px-6 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Profile Settings
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your personal and business information
          </p>
        </div>
        
        {error && (
          <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6">
              {/* Logo upload */}
              <div className="sm:col-span-2 flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2 relative">
                  {isLogoLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Business logo" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // If image fails to load, show fallback
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = ''; // Clear src
                        setLogoPreview(null);
                        toast.error('Failed to load logo');
                      }}
                    />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                
                <label htmlFor="logo" className="cursor-pointer flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mt-2">
                  <span>{logoPreview ? 'Change logo' : 'Upload logo'}</span>
                  <input
                    id="logo"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={handleLogoChange}
                    disabled={isLogoLoading}
                  />
                </label>
                
                {logoError && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {logoError}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1 text-center max-w-xs">
                  Upload a logo smaller than 1MB. JPG, PNG, GIF, and WEBP formats are supported.
                </p>
              </div>
              
              {/* Business Name */}
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  id="business_name"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.business_name ? 'border-red-300' : ''}`}
                  placeholder="Your business name"
                  {...register('business_name', { required: 'Business name is required' })}
                />
                {errors.business_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
                )}
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phone"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.phone ? 'border-red-300' : ''}`}
                  placeholder="+91 9876543210"
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
              
              {/* PAN Number */}
              <div>
                <label htmlFor="pan_number" className="block text-sm font-medium text-gray-700">
                  PAN Number
                </label>
                <input
                  type="text"
                  id="pan_number"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.pan_number ? 'border-red-300' : ''}`}
                  placeholder="ABCDE1234F"
                  {...register('pan_number')}
                />
                {errors.pan_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.pan_number.message}</p>
                )}
              </div>
              
              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none ${errors.address ? 'border-red-300' : ''}`}
                  placeholder="Your business address"
                  {...register('address')}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>
              
              {/* Brand Colors */}
              <div>
                <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">
                  Primary Brand Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="primary_color"
                    className="h-8 w-8 border border-gray-300 rounded-md cursor-pointer"
                    {...register('primary_color')}
                  />
                  <input
                    type="text"
                    className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('primary_color')}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="secondary_color" className="block text-sm font-medium text-gray-700">
                  Secondary Brand Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="secondary_color"
                    className="h-8 w-8 border border-gray-300 rounded-md cursor-pointer"
                    {...register('secondary_color')}
                  />
                  <input
                    type="text"
                    className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('secondary_color')}
                  />
                </div>
              </div>
              
              {/* Footer Text */}
              <div>
                <label htmlFor="footer_text" className="block text-sm font-medium text-gray-700">
                  Invoice Footer Text
                </label>
                <textarea
                  id="footer_text"
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                  placeholder="Thank you for your business!"
                  {...register('footer_text')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This text will appear at the bottom of your invoices.
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={loading || (!isDirty && !logoFile)}
              className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading || isLogoLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;