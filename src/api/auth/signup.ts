
import { Request, Response } from 'express';
import { User } from '../../lib/db/models/User';
import { generateVerificationToken, generateOTP } from '../../lib/auth/jwt';
import { sendVerificationEmail } from '../../lib/email/sendEmail';
import connectDB from '../../lib/db/connect';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, password, fullName, role, department, phoneNumber, secretNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Validate faculty secret number if role is faculty
    if (role === 'faculty') {
      // In production, verify against a list of valid faculty secret numbers
      if (!secretNumber || secretNumber !== 'FACULTY2024') {
        return res.status(400).json({ error: 'Invalid faculty secret number' });
      }
    }

    // Generate verification token and OTP
    const verificationToken = generateVerificationToken();
    const otp = generateOTP();

    // Create new user
    const user = new User({
      email,
      password,
      fullName,
      role,
      department,
      phoneNumber,
      secretNumber: role === 'faculty' ? secretNumber : undefined,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      otp: otp,
      otpExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    await user.save();

    // Send verification email with OTP
    await sendVerificationEmail(email, verificationToken, otp);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

