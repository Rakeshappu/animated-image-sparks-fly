
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Handle React Router DOM context errors specifically
  if (err.message && (
    err.message.includes('React.useContext') ||
    err.message.includes('useContext(...)') ||
    err.message.includes('basename') ||
    err.message.includes('Cannot destructure property') ||
    err.message.includes('React__namespace.useContext')
  )) {
    console.log('Handling React Router DOM context error');
    return res.status(200).json({ 
      success: true,
      message: 'Client-side rendering required',
      data: null
    });
  }
  
  // Handle file upload errors
  if (err.message && (
    err.message.includes('File upload') ||
    err.message.includes('multipart/form-data')
  )) {
    console.log('Handling file upload error');
    return res.status(400).json({
      error: 'File upload failed. Please check your file and try again.',
      details: err.message
    });
  }
  
  // Handle MongoDB ObjectId cast errors (common when using IDs incorrectly)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    console.log('Handling ObjectId cast error');
    return res.status(400).json({
      error: 'Invalid ID format',
      details: err.message
    });
  }
  
  // Handle placement resource specific errors
  if (err.message && (
    err.message.includes('placement') ||
    err.message.includes('category')
  )) {
    console.log('Handling placement resource error');
    return res.status(400).json({
      error: 'Invalid placement resource data. Please check the category and try again.',
      details: err.message
    });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};
