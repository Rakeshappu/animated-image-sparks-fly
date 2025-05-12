
import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User';
import { EligibleUSN } from '../../../lib/db/models/EligibleUSN';
import { generateOTP, generateVerificationToken } from '../../../lib/auth/jwt';
import { sendVerificationEmail } from '../../../lib/email/sendEmail';
import connectDB from '../../../lib/db/connect';
import cors from 'cors';

const corsMiddleware = cors({
  origin: 'http://localhost:8080',
  methods: ['POST', 'OPTIONS'],
  credentials: true,
});

const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: Function) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsMiddleware);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { email, password, fullName, role, department, phoneNumber, secretNumber, semester, usn } = req.body;

    console.log('Signup request received:', { email, fullName, role });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already registered:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Validate faculty secret number
    if (role === 'faculty' && (!secretNumber || secretNumber !== 'FACULTY2024')) {
      console.log('Invalid faculty secret number provided');
      return res.status(400).json({ error: 'Invalid faculty secret number' });
    }
    
    // For students, validate USN
    if (role === 'student') {
      if (!usn) {
        return res.status(400).json({ error: 'USN is required for student registration' });
      }

      // Check if USN already exists
      const existingUSNUser = await User.findOne({ usn });
      if (existingUSNUser) {
        return res.status(400).json({ error: 'USN already registered with another account' });
      }

      // Check if USN is in the eligible list
      const eligibleUSN = await EligibleUSN.findOne({ 
        usn: usn.toUpperCase(),
        isUsed: false
      });
      
      if (!eligibleUSN) {
        return res.status(400).json({ error: 'This USN is not eligible for registration' });
      }
      
      // Mark USN as used
      eligibleUSN.isUsed = true;
      await eligibleUSN.save();
    }
    
    const otp = generateOTP();
    const verificationToken = generateVerificationToken();
    
    console.log('Generated OTP:', otp, 'for user:', email);

    // Create user data object with common fields
    const userData: any = {
      email,
      password,
      fullName,
      role,
      department,
      phoneNumber,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      verificationCode: otp,
      verificationCodeExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    };

    // Add role-specific fields
    if (role === 'faculty') {
      userData.secretNumber = secretNumber;
    }
    if (role === 'student') {
      userData.semester = semester;
      userData.usn = usn ? usn.toUpperCase() : undefined;
    }

    const user = new User(userData);
    await user.save();
    console.log('User created successfully:', email);

    // Send OTP to email
    await sendVerificationEmail(email, verificationToken, otp);
    console.log('Verification email sent to:', email);

    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
