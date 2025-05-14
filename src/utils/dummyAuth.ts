import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../types';

export function createDummyUser(role: UserRole = 'student'): User {
  const id = uuidv4();
  
  return {
    _id: id,
    email: `${role}${id.substring(0, 5)}@versatileshare.com`,
    fullName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
    role,
    department: 'Computer Science',
    isEmailVerified: true,
    isVerified: true, // Add this missing property
    semester: role === 'student' ? Math.floor(Math.random() * 8) + 1 : undefined
  } as User;
}
