
// User roles type
export type UserRole = 'student' | 'faculty' | 'admin';

// Auth context type
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (data: SignupFormData) => Promise<any>;
  logout: () => Promise<any>;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
  updateUser?: (userData: Partial<User>) => void;
  setError?: (error: string | null) => void;
}

// User type definition
export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  phoneNumber?: string;
  avatar?: string;
  photoURL?: string; // Added for compatibility
  displayName?: string; // Added for compatibility
  semester?: number;
  secretNumber?: string;
  streak?: number;
  isVerified: boolean;
  gender?: 'Male' | 'Female' | 'Other';
  batch?: string;
  degree?: string;
  usn?: string;
  qualification?: string;
  designation?: string;
  createdAt?: string;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}

// Signup form data
export interface SignupFormData {
  role: UserRole;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  phoneNumber: string;
  semester?: number;
  secretNumber?: string;
  usn?: string;
}

// OTP verification data
export interface OTPVerificationData {
  email: string;
  otp: string;
}

export interface Notification {
  _id?: string;
  message: string;
  resourceId?: string;
  createdAt: Date | string;
  read: boolean;
}
