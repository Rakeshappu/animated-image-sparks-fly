#!/bin/bash
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Add types/jsonwebtoken
echo "Installing additional type definitions..."
npm install --save-dev @types/jsonwebtoken

# Add build:dev script to package.json
echo "Adding build:dev script to package.json..."
node add-build-dev.js

# Build client
echo "Building client..."
npm run build

# Build server with correct TypeScript configuration
echo "Building server..."
npx tsc -p tsconfig.server.json

echo "Build complete!"