import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { toast } from 'react-hot-toast';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmailToken = async (token: string) => {
      try {
        await authService.verifyEmail(token);
        toast.success('Email verified successfully');
      } catch (error) {
        console.error('Error verifying email:', error);
        toast.error('Failed to verify email');
      }
    };

    if (token) {
      verifyEmailToken(token);
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {token
              ? 'Verifying your email...'
              : 'Please check your email for the verification link'}
          </p>
        </div>
      </div>
    </div>
  );
};