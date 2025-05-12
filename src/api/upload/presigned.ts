
import { Request, Response } from 'express';
import { s3Config } from '../../lib/config/services.ts';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { localStorageConfig } from '../../lib/config/services.ts';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    // Check if we should use local storage instead of S3
    if (s3Config.useMocks || !s3Config.isConfigured()) {
      console.log('Using local storage for file upload instead of S3');
      return handleLocalUpload(fileName, res);
    }

    // Configure AWS S3
    const s3 = new S3({
      region: s3Config.region,
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
      signatureVersion: s3Config.signatureVersion,
    });

    const fileKey = `uploads/${uuidv4()}-${fileName}`;

    // Generate presigned URL
    const presignedUrl = await s3.getSignedUrlPromise('putObject', {
      Bucket: s3Config.bucketName,
      Key: fileKey,
      ContentType: fileType,
      Expires: 300, // URL expires in 5 minutes
    });

    res.json({
      presignedUrl,
      fileKey,
      fileUrl: `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${fileKey}`,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
}

async function handleLocalUpload(fileName: string, res: Response) {
  try {
    // Generate a unique file key
    const fileId = uuidv4();
    const fileKey = `uploads/${fileId}-${fileName}`;
    
    // Create the local storage directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), localStorageConfig.basePath, 'uploads');
    
    if (localStorageConfig.createDirIfNotExists) {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`Created local storage directory: ${uploadDir}`);
      }
    }
    
    // This local URL will be used by the client to POST the file
    const localUploadUrl = `/api/upload/local?fileKey=${fileKey}`;
    
    const fileInfo = {
      presignedUrl: localUploadUrl,
      fileKey: fileKey,
      fileUrl: `/api/upload/download/${fileId}`,
      fileId: fileId,
      localFile: true
    };
    
    return res.status(200).json(fileInfo);
  } catch (error) {
    console.error('Error handling local upload:', error);
    return res.status(500).json({ error: 'Failed to handle local upload' });
  }
}
