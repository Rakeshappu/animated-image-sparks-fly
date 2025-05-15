
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface OtpVerificationProps {
  email: string;
  onResendOtp: () => void;
  onVerificationSuccess?: () => void;
  passwordReset?: boolean;
}

export const OtpVerification = ({ email, onResendOtp, onVerificationSuccess, passwordReset = false }: OtpVerificationProps) => {
  const { verifyOTP, error } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
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
    if (otpString.length !== 6) return;
    
    setIsSubmitting(true);
    try {
      if (passwordReset) {
        // Verify OTP for password reset
        const response = await api.post('/api/auth/verify-otp', { email, otp: otpString });
        if (response.data.success) {
          toast.success('OTP verified successfully');
          setOtpVerified(true);
        }
      } else if (verifyOTP) {
        // Use context method for normal OTP verification
        await verifyOTP(email, otpString);
        if (onVerificationSuccess) {
          onVerificationSuccess();
        }
      }
    } catch (err: any) {
      console.error('OTP verification failed:', err);
      toast.error(err.response?.data?.error || 'Failed to verify OTP');
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
    
    setIsSubmitting(true);
    try {
      const otpString = otp.join('');
      const response = await api.post('/api/auth/reset-password', {
        email,
        code: otpString,
        newPassword
      });
      
      toast.success('Password has been reset successfully. You can now login with your new password.');
      
      // Redirect to login page
      window.location.href = '/auth/login';
    } catch (err: any) {
      console.error('Password reset failed:', err);
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = () => {
    onResendOtp();
    setTimeLeft(30);
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          {passwordReset ? 'Reset your password' : 'Verify your email'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a 6-digit OTP to <span className="font-medium">{email}</span>
        </p>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {!otpVerified ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
            <button
              type="submit"
              disabled={otp.some(digit => !digit) || isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <p className="text-gray-600">
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
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="text-sm text-green-700">OTP verified! Please set your new password.</div>
          </div>
          
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your new password"
              minLength={6}
            />
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Confirm your new password"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
