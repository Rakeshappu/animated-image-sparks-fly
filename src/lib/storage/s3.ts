
import AWS from 'aws-sdk';
import { s3Config } from '../config/services.ts';

// Mock storage for development without S3 credentials
const mockStorage = new Map<string, { content: any, contentType: string }>();

// Initialize S3 with our configuration
let s3: AWS.S3 | null = null;

// Only initialize S3 if credentials are available
if (s3Config.isConfigured()) {
  s3 = new AWS.S3({
    region: s3Config.region,
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
    signatureVersion: s3Config.signatureVersion,
  });
}

/**
 * Generate a presigned URL for uploading a file to S3
 */
export const getPresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  folder: string = 'uploads'
): Promise<{ uploadUrl: string; fileUrl: string }> => {
  const key = `${folder}/${Date.now()}-${fileName}`;
  
  // If S3 is not configured, use mock implementation
  if (!s3 || !s3Config.isConfigured()) {
    console.log('S3 not configured, using mock implementation');
    // For development, we'll just return mock URLs that will be handled client-side
    const mockUploadUrl = `/api/mock-upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(fileType)}`;
    const mockFileUrl = `/api/mock-file/${key}`;
    return { uploadUrl: mockUploadUrl, fileUrl: mockFileUrl };
  }
  
  const params = {
    Bucket: s3Config.bucketName,
    Key: key,
    ContentType: fileType,
    Expires: 600, // URL expires in 10 minutes
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    const fileUrl = `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
    
    return { uploadUrl, fileUrl };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Generate a presigned URL for downloading/viewing a file from S3
 */
export const getPresignedDownloadUrl = async (fileKey: string): Promise<string> => {
  // If S3 is not configured, use mock implementation
  if (!s3 || !s3Config.isConfigured()) {
    console.log('S3 not configured, using mock implementation');
    return `/api/mock-file/${fileKey}`;
  }
  
  const params = {
    Bucket: s3Config.bucketName,
    Key: fileKey,
    Expires: 3600, // URL expires in 1 hour
  };

  try {
    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Delete a file from S3
 */
export const deleteFileFromS3 = async (fileKey: string): Promise<void> => {
  // If S3 is not configured, use mock implementation
  if (!s3 || !s3Config.isConfigured()) {
    console.log('S3 not configured, using mock implementation');
    mockStorage.delete(fileKey);
    return;
  }
  
  const params = {
    Bucket: s3Config.bucketName,
    Key: fileKey,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Extract S3 key from file URL
 */
export const getKeyFromUrl = (fileUrl: string): string => {
  if (fileUrl.startsWith('/api/mock-file/')) {
    return fileUrl.replace('/api/mock-file/', '');
  }
  
  const urlParts = fileUrl.split('.amazonaws.com/');
  return urlParts.length > 1 ? urlParts[1] : fileUrl;
};

// Helper methods for the mock storage
export const saveMockFile = (key: string, content: any, contentType: string): void => {
  mockStorage.set(key, { content, contentType });
};

export const getMockFile = (key: string): { content: any, contentType: string } | undefined => {
  return mockStorage.get(key);
};
