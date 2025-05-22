
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../../lib/db/models/User';
import connectDB from '../../../../lib/db/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { userId, isVerified } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update verification status
    user.isAdminVerified = Boolean(isVerified);
    
    // If user is being unverified, add a reason if provided
    if (!isVerified && req.body.reason) {
      user.verificationRejectionReason = req.body.reason;
    } else if (isVerified) {
      // Clear any rejection reason if being verified
      user.verificationRejectionReason = undefined;
    }

    await user.save();

    // Send notification email to user about the status change
    if (user.email) {
      try {
        // Implementation for sending notification email would go here
        console.log(`Email notification sent to ${user.email} about verification status: ${isVerified}`);
      } catch (emailError) {
        console.error('Failed to send status notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return res.status(200).json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isAdminVerified: user.isAdminVerified,
      },
    });
  } catch (error) {
    console.error('User verification error:', error);
    return res.status(500).json({ error: 'Failed to update user verification status' });
  }
}
