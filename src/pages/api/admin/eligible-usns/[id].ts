
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { EligibleUSN } from '../../../../lib/db/models/EligibleUSN.ts';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'USN ID is required' });
    }
    
    // GET - Get an eligible USN by ID
    if (req.method === 'GET') {
      const eligibleUSN = await EligibleUSN.findById(id);
      
      if (!eligibleUSN) {
        return res.status(404).json({ error: 'Eligible USN not found' });
      }
      
      return res.status(200).json({ eligibleUSN });
    }
    
    // PUT - Update an eligible USN
    if (req.method === 'PUT') {
      const { usn, department, semester } = req.body;
      
      if (!usn && !department && semester === undefined) {
        return res.status(400).json({ error: 'At least one field must be updated' });
      }
      
      const eligibleUSN = await EligibleUSN.findById(id);
      
      if (!eligibleUSN) {
        return res.status(404).json({ error: 'Eligible USN not found' });
      }
      
      // If updating USN, check if new USN already exists
      if (usn && usn !== eligibleUSN.usn) {
        const existingUSN = await EligibleUSN.findOne({ usn: usn.toUpperCase() });
        if (existingUSN) {
          return res.status(400).json({ error: 'USN already exists' });
        }
        
        eligibleUSN.usn = usn.toUpperCase();
      }
      
      if (department) eligibleUSN.department = department;
      if (semester !== undefined) eligibleUSN.semester = semester;
      
      await eligibleUSN.save();
      
      return res.status(200).json({ 
        success: true, 
        message: 'Eligible USN updated successfully',
        eligibleUSN
      });
    }
    
    // DELETE - Delete an eligible USN
    if (req.method === 'DELETE') {
      const result = await EligibleUSN.findByIdAndDelete(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Eligible USN not found' });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Eligible USN deleted successfully' 
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Error managing eligible USN:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
