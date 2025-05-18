
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FormField } from './FormField';
import { Share2, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { OtpVerification } from './OtpVerification';
import authService from '../../services/auth.service';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  error?: string | null;
}

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm = ({ onSubmit, error: propError }: LoginFormProps) => {
  const { error: contextError, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use either prop error or context error
  const displayError = propError || contextError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clearError) {
      clearError();
    }
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the send-otp endpoint with resetPassword purpose
      await authService.resendOTP(forgotEmail, 'resetPassword');
      toast.success('Verification code sent to your email');
      
      // Show OTP verification component with reset password purpose
      setShowOtpVerification(true);
      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to process request. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!forgotEmail) return;
    
    setIsSubmitting(true);
    try {
      await authService.resendOTP(forgotEmail, 'resetPassword');
      toast.success('New verification code sent to your email');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend verification code');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (showOtpVerification) {
    return (
      <OtpVerification 
        email={forgotEmail} 
        onResendOtp={handleResendOtp} 
        purpose="resetPassword" 
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl"
      >
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center mb-6"
          >
            <Share2 className="h-10 w-10 text-indigo-600" />
            <span className="ml-2 text-3xl font-bold text-indigo-600">VersatileShare</span>
          </motion.div>
          
          <h2 className="text-3xl font-extrabold text-gray-900">
            {showForgotPassword ? 'Reset Password' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {showForgotPassword ? 'Enter your email to receive reset instructions' : 'Sign in to access your account'}
          </p>
        </div>

        {displayError && !showForgotPassword && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-md bg-red-50 p-4 border-l-4 border-red-400"
          >
            <div className="text-sm text-red-700">{displayError}</div>
          </motion.div>
        )}

        {showForgotPassword ? (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 space-y-6"
            onSubmit={handleForgotPassword}
          >
            <div className="space-y-4">
              <FormField
                label="Email"
                name="forgotEmail"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
            </motion.button>

            <div className="text-center text-sm pt-2">
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(false)} 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to Sign In
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 space-y-6" 
            onSubmit={handleSubmit}
          >
            <div className="space-y-4">
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
              />

              <FormField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button" 
                  onClick={() => setShowForgotPassword(true)}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-indigo-300" />
              </span>
              Sign in
            </motion.button>

            <div className="text-center text-sm pt-4">
              <span className="text-gray-600">Don't have an account?</span>{' '}
              <Link 
                to="/auth/role"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign up here
              </Link>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};
