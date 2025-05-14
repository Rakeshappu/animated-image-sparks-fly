
#!/bin/bash

# Run this script before the build process on Render
echo "Starting prebuild process..."

# Check if MongoDB URI is set
if [ -z "$MONGODB_URI" ]; then
  echo "WARNING: MONGODB_URI is not set. Please set it in your environment variables."
  echo "You can set it in the Render dashboard under Environment Variables."
  # We don't exit with error to allow deployment even without MongoDB
fi

# Create the dotenv file for development
echo "Creating .env file..."
cat > .env << EOF
MONGODB_URI=$MONGODB_URI
JWT_SECRET=${JWT_SECRET:-versatile_share_secret_key_2024}
EMAIL_USER=${EMAIL_USER:-appussrh@gmail.com}
EMAIL_PASS=${EMAIL_PASS:-ywddwayeceupflcn}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}

# AWS S3 Configuration
AWS_S3_BUCKET_NAME=${AWS_S3_BUCKET_NAME:-versatileshare}
AWS_S3_REGION=${AWS_S3_REGION:-us-east-1}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}

# Redis Configuration
REDIS_HOST=${REDIS_HOST:-redis-12843.crce179.ap-south-1-1.ec2.redns.redis-cloud.com}
REDIS_PORT=${REDIS_PORT:-12843}
REDIS_PASSWORD=${REDIS_PASSWORD:-x3Xaz1yBvY8z5ZR4LmpgjvuIniv5Z14U}

# Elasticsearch Configuration
ELASTICSEARCH_NODE=${ELASTICSEARCH_NODE:-http://localhost:9200}
ELASTICSEARCH_USERNAME=${ELASTICSEARCH_USERNAME:-elastic}
ELASTICSEARCH_PASSWORD=${ELASTICSEARCH_PASSWORD:-AR5nCdAfor8huQOrXGU7kww5}

OPENAI_API_KEY=${OPENAI_API_KEY:-}
EOF

# Fix permissions
chmod +x build.sh

echo "Prebuild complete!"
