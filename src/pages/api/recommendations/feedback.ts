
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Schema for recommendation feedback
const RecommendationFeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recommendationId: {
    type: String,
    required: true,
  },
  feedback: {
    type: String,
    enum: ['like', 'dislike', 'helpful', 'not_helpful'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const RecommendationFeedback = mongoose.models.RecommendationFeedback || 
  mongoose.model('RecommendationFeedback', RecommendationFeedbackSchema);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get user from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    const { recommendationId, feedback } = req.body;

    if (!recommendationId || !feedback) {
      return res.status(400).json({ error: 'Recommendation ID and feedback are required' });
    }

    // Check if feedback already exists
    const existingFeedback = await RecommendationFeedback.findOne({
      userId: decoded.userId,
      recommendationId
    });

    if (existingFeedback) {
      // Update existing feedback
      existingFeedback.feedback = feedback;
      existingFeedback.timestamp = new Date();
      await existingFeedback.save();
    } else {
      // Create new feedback
      await RecommendationFeedback.create({
        userId: decoded.userId,
        recommendationId,
        feedback,
        timestamp: new Date()
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Feedback recorded successfully' 
    });
  } catch (error) {
    console.error('Error recording recommendation feedback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
