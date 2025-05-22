import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../../services/auth.service';
import { useAuth } from '../../../contexts/AuthContext';
import { Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const EmailVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useAuth();
  const [otp, setOtp] = useState('');
  const email = location.state?.email;
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Submitting OTP verification:', { email, otp }); 
      await authService.verifyOTP(email, otp);
      toast.success('Email verified successfully');
      navigate('/auth/login');
    } catch (err: any) {
      console.error('OTP verification failed:', err);
      console.error('Error:', err.message);
      toast.error(err.message || 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authService.resendOTP(email);
      toast.success('OTP resent successfully');
    } catch (err: any) {
      console.error('Error:', err.message);
      toast.error(err.message || 'Failed to resend OTP');
      navigate('/auth/signup');
      return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification code to {email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="text"
            required
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Resend OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
