
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupFormData } from '../../../types/auth';
import { authService } from '../../../services/auth.service';
import { useAuth } from '../../../contexts/AuthContext';
import { SignupForm as SignupFormComponent } from '../../../components/auth/SignupForm';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

export const SignupForm = () => {
  const navigate = useNavigate();
  const selectedRole = localStorage.getItem('selectedRole') as 'student' | 'faculty' | 'admin';
  
  const handleSubmit = async (formData: SignupFormData) => {
    try {
      // Validate USN for students
      if (formData.role === 'student' && (!formData.usn || formData.usn.trim() === '')) {
        toast.error('USN is required for student registration');
        return;
      }
      
      // Ensure USN is uppercase for consistent checking
      if (formData.usn) {
        formData.usn = formData.usn.toUpperCase().trim();
      }
      
      // Log the signup attempt
      console.log('Attempting signup with:', { 
        email: formData.email, 
        role: formData.role,
        usn: formData.usn || 'N/A'
      });
      
      try {
        // Use the api service directly with absolute URL path to bypass proxy issues
        const response = await api.post('/api/auth/signup', formData);
        
        if (response && response.data) {
          toast.success('Registration successful!');
          
          // For all roles, first navigate to email verification
          toast.success('Please verify your email.');
          navigate('/auth/verify', { state: { email: formData.email, role: formData.role } });
        }
      } catch (apiError: any) {
        console.error('API signup error:', apiError);
        const errorMessage = apiError.message || 'Registration failed';
        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <SignupFormComponent role={selectedRole} onSubmit={handleSubmit} />
  );
};
