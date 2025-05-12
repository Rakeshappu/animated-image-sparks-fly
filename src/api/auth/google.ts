
import { Request, Response } from 'express';
import { User } from '../../lib/db/models/User.ts';
import { verifyGoogleToken } from '../../lib/auth/google.ts';
import { generateToken } from '../../lib/auth/jwt.ts';
import connectDB from '../../lib/db/connect.ts';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { token } = req.body;
    const googleUser = await verifyGoogleToken(token);

    // Find or create user
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // For new users, we need to collect additional information
      return res.status(202).json({
        message: 'Additional information needed',
        email: googleUser.email,
        fullName: googleUser.name,
      });
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id.toString());

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
