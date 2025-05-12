
import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User';
import { generateToken } from '../../../lib/auth/jwt';
import connectDB from '../../../lib/db/connect';
import { Activity } from '../../../lib/db/models/Activity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
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

    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log('User email not verified:', email);
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Calculate user streak
    let streak = 0;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if user had activity today
      const todayActivity = await Activity.findOne({
        user: user._id,
        timestamp: { $gte: today }
      });
      
      // Check if user had activity yesterday
      const yesterdayActivity = await Activity.findOne({
        user: user._id,
        timestamp: { $gte: yesterday, $lt: today }
      });
      
      if (todayActivity) {
        // User has activity today, so streak is at least 1
        streak = user.streak || 1;
      } else if (yesterdayActivity) {
        // User had activity yesterday but not today
        // Maintain current streak from user record
        streak = user.streak || 0;
      } else {
        // No activity today or yesterday, reset streak
        streak = 0;
      }
      
      // Update user streak in database
      if (streak !== user.streak) {
        user.streak = streak;
        await user.save();
      }
    } catch (streakError) {
      console.error('Error calculating streak:', streakError);
      // Use existing streak value if calculation fails
      streak = user.streak || 0;
    }

    // Generate JWT token with role explicitly included
    const token = generateToken(user._id, user.role);
    console.log('Login successful for:', email, 'with role:', user.role);

    // Return user data and token
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        semester: user.semester,
        streak: streak,
        lastActive: user.lastActive
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
