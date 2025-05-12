
// This is just the part where the verifyOTP function is called safely
// We'll add a check before calling it

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (isSubmitting) return;
  
  if (!validateOTP()) {
    setError('Please enter a valid 6-digit OTP');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    // Check if verifyOTP exists before calling it
    if (typeof authService.verifyOTP === 'function') {
      const response = await authService.verifyOTP(email, otp);
      
      if (response && response.success) {
        setVerified(true);
        toast.success('Email verification successful');
      } else {
        setError(response?.message || 'Invalid OTP. Please try again.');
      }
    } else {
      // Fallback
      setError('OTP verification service is not available');
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    setError('Failed to verify OTP. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

const handleResendOTP = async () => {
  if (isResending) return;
  
  setIsResending(true);
  
  try {
    // Check if resendOTP exists before calling it
    if (typeof authService.resendOTP === 'function') {
      const response = await authService.resendOTP(email);
      
      if (response && response.success) {
        toast.success('A new OTP has been sent to your email');
        // Reset verification state
        setOtp(Array(6).fill(''));
        setError('');
      } else {
        setError(response?.message || 'Failed to resend OTP. Please try again.');
      }
    } else {
      // Fallback
      setError('OTP resend service is not available');
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    setError('Failed to resend OTP. Please try again.');
  } finally {
    setIsResending(false);
  }
};
