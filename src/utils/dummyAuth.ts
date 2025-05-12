
import { User, UserRole } from '../types/auth';

// Simulating a database of users
const users = [
  {
    _id: 'student-123',
    email: 'student@example.com',
    password: 'password123',
    fullName: 'Student User',
    role: 'student' as UserRole,
    department: 'Computer Science',
    isEmailVerified: true,
    semester: 3
  },
  {
    _id: 'faculty-456',
    email: 'faculty@example.com',
    password: 'password123',
    fullName: 'Faculty User',
    role: 'faculty' as UserRole,
    department: 'Computer Science',
    isEmailVerified: true
  },
  {
    _id: 'admin-789',
    email: 'admin@example.com',
    password: 'admin123',
    fullName: 'Admin User',
    role: 'admin' as UserRole,
    department: 'Administration',
    isEmailVerified: true
  }
];

// Simulated login function
export const dummyLogin = async (email: string, password: string) => {
  console.log('Dummy login with:', { email, password });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find user
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.password !== password) {
    throw new Error('Invalid password');
  }
  
  // Generate fake token (in a real app this would be a JWT)
  const token = `dummy-token-${Date.now()}`;
  
  return {
    token,
    user: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      isEmailVerified: user.isEmailVerified,
      semester: user.semester
    } as User
  };
};
