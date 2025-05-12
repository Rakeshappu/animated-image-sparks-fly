#!/bin/bash
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build client
echo "Building client..."
npm run build

# Build server with correct TypeScript configuration
echo "Building server..."
npx tsc -p tsconfig.server.json

echo "Build complete!"