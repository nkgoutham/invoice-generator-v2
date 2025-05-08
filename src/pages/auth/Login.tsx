import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FileText, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { signIn, resetPassword, error, loading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginFormData>();
  const watchEmail = watch('email', '');
  
  const onSubmit = async (data: LoginFormData) => {
    const success = await signIn(data.email, data.password);
    if (success) {
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } else {
      // Login failed - the error message is already set in the store
      // We don't need to do anything here as the error will be displayed in the UI
    }
  };

  // Check if the error message indicates the user doesn't exist
  const isUserNotFoundError = error && (
    error.includes('Invalid login credentials') || 
    error.includes('Email not confirmed') ||
    error.includes('Invalid email or password')
  );
  
  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!resetEmail && watchEmail) {
      setResetEmail(watchEmail);
    }
    
    setIsResettingPassword(true);
    setResetSuccess(false);
  };
  
  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      toast.success('Password reset link sent to your email');
    } catch (err) {
      // Error is handled in auth store
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img 
          src="/full_logo.png" 
          alt="InvoicePro Logo" 
          className="h-24 mx-auto mb-6"
        />
        <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Or{' '}
          <Link to="/register" className="font-medium text-accent-500 hover:text-accent-600 transition-colors">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card px-4 py-6 sm:px-10 sm:py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
              
              {isUserNotFoundError && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm font-medium">Hmm, we don't recognize those credentials! 🤔</p>
                  <p className="mt-1 text-sm">
                    We're working on mind-reading technology, but it's not quite there yet. 
                    Please <Link to="/register" className="font-semibold underline">create an account first</Link> if you haven't already.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {isResettingPassword ? (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label htmlFor="reset-email" className="form-label">
                  Email address
                </label>
                <div className="mt-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="form-input pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              {resetSuccess && (
                <div className="p-4 bg-green-50 text-green-800 rounded-md text-sm">
                  <p className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Password reset link sent! Please check your email.
                  </p>
                  <p className="mt-2">
                    If you don't see the email, please check your spam folder.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setIsResettingPassword(false)}
                  className="w-full btn btn-secondary btn-md"
                >
                  Back to Login
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading || resetSuccess}
                  className="w-full btn btn-primary btn-md"
                >
                  {resetLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Sending...
                    </span>
                  ) : resetSuccess ? 'Link Sent' : 'Send Reset Link'}
                </button>
              </div>
              
              <p className="text-xs text-neutral-500 mt-4">
                We'll send a password reset link to your email address. Please check your inbox and spam folder.
              </p>
            </div>
          ) : (
            <>
              <form className="space-y-6 animate-fade-in" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="email" className="form-label">
                    Email address
                  </label>
                  <div className="mt-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className={`form-input pl-10 ${
                        errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : ''
                      }`}
                      placeholder="you@example.com"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <svg className="h-3 w-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="mt-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-150" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`form-input pl-10 ${
                        errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : ''
                      }`}
                      placeholder="••••••••"
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-neutral-400 hover:text-neutral-600 focus:outline-none transition-colors"
                      >
                        {showPassword ? (
                          <span className="text-xs font-medium">Hide</span>
                        ) : (
                          <span className="text-xs font-medium">Show</span>
                        )}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <svg className="h-3 w-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-accent-500 focus:ring-accent-500 border-neutral-300 rounded transition-colors"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm text-right">
                    <a 
                      href="#" 
                      className="font-medium text-accent-500 hover:text-accent-600 transition-colors inline-flex items-center"
                      onClick={handleForgotPassword}
                    >
                      Forgot your password?
                    </a>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary btn-md group"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing in...
                      </span>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* New user prompt */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium">New to InvoicePro?</p>
                <p className="mt-1 text-sm text-blue-600">
                  Create an account to start managing your invoices and expenses with ease.
                </p>
                <Link 
                  to="/register" 
                  className="mt-3 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Create an account
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;