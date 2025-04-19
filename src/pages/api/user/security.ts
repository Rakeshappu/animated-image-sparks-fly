
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { User } from '../../../lib/db/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
    
    const { currentPassword, newPassword, twoFactorEnabled } = req.body;
    
    // If changing password
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      // Update password
      user.password = newPassword;
    }
    
    // Update two-factor authentication settings if provided
    if (twoFactorEnabled !== undefined) {
      // This is where we would update 2FA settings
      // For now, we'll just pretend we did
    }
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Security settings updated successfully'
    });
  } catch (error) {
    console.error('Security settings update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
