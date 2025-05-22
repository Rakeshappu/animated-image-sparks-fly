
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import authService from '../../services/auth.service';
import { toast } from 'react-hot-toast';
import { FormField } from './FormField';

interface OtpVerificationProps {
  email: string;
  onResendOtp: () => void;
  purpose?: 'emailVerification' | 'resetPassword';
}

export const OtpVerification = ({ email, onResendOtp, purpose = 'emailVerification' }: OtpVerificationProps) => {
  const { verifyOTP } = useAuth() || {}; // Fix for undefined error with a fallback
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setTimeout(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Only accept digits
    if (value && !/^\d+$/.test(value)) return;
    
    // Update OTP array
    const newOtp = [...otp];
    // Take only the last character if multiple are pasted
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Auto-focus next input if current input is filled
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Only proceed if pasted data is numeric and of correct length
    if (!/^\d+$/.test(pastedData)) return;
    
    const pastedOtp = pastedData.split('').slice(0, 6);
    const newOtp = [...otp];
    
    pastedOtp.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });
    
    setOtp(newOtp);
    
    // Focus the appropriate input after paste
    if (pastedOtp.length < 6) {
      inputRefs.current[pastedOtp.length]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits of the OTP');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (purpose === 'resetPassword') {
        console.log('Verifying OTP for password reset:', email, otpString);
        // For password reset flow - verify OTP with resetPassword purpose
        const response = await authService.verifyOTP(email, otpString, 'resetPassword');
        if (response.success) {
          setOtpVerified(true);
          toast.success('OTP verified successfully. You can now reset your password.');
        }
      } else {
        // For email verification flow
        if (verifyOTP) {
          await verifyOTP(email, otpString);
          toast.success('Email verified successfully');
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('OTP verification failed:', err);
      const errorMessage = err.message || 'Invalid or expired OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setResetSubmitting(true);
    try {
      // Submit the new password along with email and verified OTP
      const otpString = otp.join('');
      await authService.resetPassword(email, otpString, newPassword);
      
      toast.success('Your password has been reset successfully!');
      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      const errorMessage = err.message || 'Failed to reset password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleResendOtp = () => {
    // Call the resend function and reset timer
    onResendOtp();
    setTimeLeft(30);
  };

  const goToLogin = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {otpVerified ? 'Reset Your Password' : 'Verify Your Email'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {otpVerified 
              ? 'Create a new password for your account' 
              : `We've sent a 6-digit OTP to ${email}`
            }
          </p>
        </div>
        
        {otpVerified ? (
          // Password reset form after OTP verification
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onSubmit={handleResetPassword} 
            className="mt-8 space-y-6"
          >
            <div className="space-y-4">
              <FormField
                label="New Password"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              
              <FormField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={resetSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {resetSubmitting ? 'Resetting...' : 'Reset Password'}
            </motion.button>

            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={goToLogin}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to Login
              </button>
            </div>
          </motion.form>
        ) : (
          // OTP verification form
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onSubmit={handleSubmit} 
            className="mt-8 space-y-6"
          >
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={digit}
                  onChange={e => handleChange(e, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
            
            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={otp.some(digit => !digit) || isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                {isSubmitting ? 'Verifying...' : 'Verify OTP'}
              </motion.button>
            </div>
            
            <div className="text-center text-sm">
              <p className="text-gray-600 mb-2">
                Didn't receive the OTP?{' '}
                {timeLeft > 0 ? (
                  <span>Resend in {timeLeft}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
              
              <button 
                type="button" 
                onClick={goToLogin} 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to Login
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};
