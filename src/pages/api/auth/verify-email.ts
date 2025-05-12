
import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User.ts';
import connectDB from '../../../lib/db/connect.ts';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:8080'] 
    : ['your-production-domain.com'],
  credentials: true,
});

// Helper method to run middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find user with matching OTP
    const user = await User.findOne({
      email,
      verificationCode: otp,
      verificationCodeExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Update user
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    res.json({ 
      message: 'Email verified successfully',
      isAdminVerified: user.isAdminVerified,
      requiresAdminVerification: true,
      role: user.role
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
