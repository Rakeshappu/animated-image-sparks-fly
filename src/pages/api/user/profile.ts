
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { User } from '../../../lib/db/models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Profile update request received:', req.body);
    
    // Update user fields based on role and permissions
    const { 
      fullName, 
      phoneNumber, 
      department, 
      avatar, 
      gender, 
      batch, 
      degree,
      usn,
      semester,
      qualification,
      designation
    } = req.body;
    
    // Common fields that can be updated by any user
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (gender !== undefined) user.gender = gender;
    
    // Role-specific fields - certain fields can only be updated if you're an admin
    if (user.role === 'admin') {
      // Admins can update everything
      if (fullName !== undefined) user.fullName = fullName;
      if (department !== undefined) user.department = department;
      if (batch !== undefined) user.batch = batch;
      if (degree !== undefined) user.degree = degree;
      if (usn !== undefined) user.usn = usn;
      if (semester !== undefined) user.semester = semester;
    } else if (user.role === 'faculty') {
      // Faculty can update their qualification and designation
      if (qualification !== undefined) user.qualification = qualification;
      if (designation !== undefined) user.designation = designation;
    }
    // Students can only update common fields defined above
    
    // Only update avatar if it's provided and valid
    const avatarUpdateTimestamp = Date.now();
    if (avatar !== undefined && avatar !== '') {
      console.log('Updating user avatar to:', avatar.substring(0, 100) + '...');
      
      // Clean up URL to avoid double timestamps
      let cleanAvatarUrl = avatar;
      if (avatar.includes('?t=')) {
        cleanAvatarUrl = avatar.split('?t=')[0];
      }
      
      // Add timestamp to prevent caching issues
      user.avatar = `${cleanAvatarUrl}?t=${avatarUpdateTimestamp}`;
      console.log('Final avatar URL with timestamp:', user.avatar);
    }
    
    console.log('Updating user profile with data:', { 
      phoneNumber, 
      avatarProvided: !!avatar,
      gender,
      finalAvatar: user.avatar,
      role: user.role,
      qualificationUpdated: user.role === 'faculty' && qualification !== undefined,
      designationUpdated: user.role === 'faculty' && designation !== undefined,
    });
    
    await user.save();
    console.log('User profile saved successfully');
    
    // Return updated user data
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber || '',
        avatar: user.avatar, // The avatar now has a timestamp for cache busting
        gender: user.gender,
        batch: user.batch,
        degree: user.degree,
        usn: user.usn,
        semester: user.semester,
        qualification: user.qualification,
        designation: user.designation,
        isVerified: user.isEmailVerified,
        notifications: user.notifications
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
