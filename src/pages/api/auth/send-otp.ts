
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User';
import { generateOTP } from '../../../lib/auth/otp';
import { transporter } from '../../../lib/email/config';
import connectDB from '../../../lib/db/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, purpose = 'emailVerification' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with that email address' });
    }

    // Generate new OTP
    const verificationOTP = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setHours(otpExpiry.getHours() + 1); // OTP valid for 1 hour

    // Update user with new OTP
    user.verificationCode = verificationOTP;
    user.verificationCodeExpiry = otpExpiry;
    await user.save();

    // Determine email content based on purpose
    let subject, html;
    if (purpose === 'resetPassword') {
      subject = 'Password Reset Request';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset</h2>
          <p>Hello ${user.fullName},</p>
          <p>We received a request to reset your password. Use the code below to reset your password:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h3 style="font-size: 24px; margin: 0; letter-spacing: 5px; color: #4F46E5;">${verificationOTP}</h3>
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support.</p>
          <p>Thank you,<br>VersatileShare Team</p>
        </div>
      `;
    } else {
      subject = 'Email Verification';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Verify Your Email</h2>
          <p>Hello ${user.fullName},</p>
          <p>Thank you for signing up! Please use the verification code below to confirm your email address:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h3 style="font-size: 24px; margin: 0; letter-spacing: 5px; color: #4F46E5;">${verificationOTP}</h3>
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>Thank you,<br>VersatileShare Team</p>
        </div>
      `;
    }

    // Send email with OTP
    const mailOptions = {
      from: `"VersatileShare" <${process.env.EMAIL_USER || 'noreply@example.com'}>`,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`${purpose} email sent to:`, email);

    return res.status(200).json({ 
      success: true, 
      message: `Verification code sent to ${email}` 
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
}
