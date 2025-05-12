import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';

interface OtpVerificationProps {
  email: string;
  onResendOtp: () => void;
}

export const OtpVerification = ({ email, onResendOtp }: OtpVerificationProps) => {
  const { verifyOTP, error } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
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
    if (value && index < 5 && inputRefs.current[index + 1]) {
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
      await verifyOTP(email, otpString);
    } catch (err) {
      console.error('OTP verification failed:', err);
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
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verify your email</h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a 6-digit OTP to <span className="font-medium">{email}</span>
        </p>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
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
    </div>
  );
};
