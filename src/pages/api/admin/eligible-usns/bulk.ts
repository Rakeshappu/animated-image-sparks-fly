
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { EligibleUSN } from '../../../../lib/db/models/EligibleUSN.ts';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string, role: string };
    
    // Ensure the user is an admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { usns, department, semester } = req.body;
    
    if (!usns || !Array.isArray(usns) || usns.length === 0) {
      return res.status(400).json({ error: 'USNs must be a non-empty array' });
    }
    
    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }
    
    if (!semester) {
      return res.status(400).json({ error: 'Semester is required' });
    }
    
    const results = {
      total: usns.length,
      added: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    // Process each USN
    for (const usn of usns) {
      try {
        // Normalize USN to uppercase and trim
        const normalizedUSN = usn.trim().toUpperCase();
        
        // Skip empty USNs
        if (!normalizedUSN) {
          results.skipped++;
          continue;
        }
        
        // Check if USN already exists
        const existingUSN = await EligibleUSN.findOne({ usn: normalizedUSN });
        if (existingUSN) {
          results.skipped++;
          continue;
        }
        
        // Create new eligible USN
        const newEligibleUSN = new EligibleUSN({
          usn: normalizedUSN,
          department,
          semester,
          createdBy: decoded.userId
        });
        
        await newEligibleUSN.save();
        results.added++;
      } catch (error) {
        results.skipped++;
        results.errors.push(`Failed to add USN ${usn}: ${(error as Error).message}`);
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Added ${results.added} out of ${results.total} USNs`,
      results
    });
    
  } catch (error) {
    console.error('Error bulk importing eligible USNs:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
