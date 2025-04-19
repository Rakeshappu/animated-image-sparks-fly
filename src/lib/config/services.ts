
// Configuration for all third-party services

// AWS S3 Configuration
export const s3Config = {
  bucketName: process.env.AWS_S3_BUCKET_NAME || 'versatileshare',
  region: process.env.AWS_S3_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  isConfigured: () => Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
  useMocks: process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development' || !Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
  endpoint: process.env.AWS_S3_ENDPOINT
};

// Redis Configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  isConfigured: () => Boolean(process.env.REDIS_HOST && process.env.REDIS_PASSWORD),
  useMocks: process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development' || !Boolean(process.env.REDIS_HOST && process.env.REDIS_PASSWORD),
  // Options for local memory cache when Redis is not available
  localCache: {
    defaultTTL: 3600, // 1 hour in seconds
    checkInterval: 300, // 5 minutes in seconds
  }
};

// Elasticsearch Configuration
export const elasticsearchConfig = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
  isConfigured: () => Boolean(process.env.ELASTICSEARCH_NODE),
  useMocks: process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development' || !Boolean(process.env.ELASTICSEARCH_NODE),
  // Fallback search settings
  fallback: {
    useInMemorySearch: true,
    indexRefreshInterval: 60 * 1000, // 1 minute
  }
};

// Socket.io Configuration
export const socketConfig = {
  cors: {
    origin: process.env.NODE_ENV === 'development'
      ? ['http://localhost:5173', 'http://localhost:8080']
      : ['https://versatileshare.vercel.app', 'https://versatileshare.netlify.app'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  connectionRetry: {
    attempts: 5,
    delay: 3000, // 3 seconds
    usePolling: true,
    pollingInterval: 10000, // 10 seconds
  }
};

// Local storage mock configuration
export const localStorageConfig = {
  basePath: process.env.NODE_ENV === 'development' ? './mock-storage' : '/tmp/mock-storage',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB max file size for local storage
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'text/plain',
    'text/csv'
  ],
  createDirIfNotExists: true
};
