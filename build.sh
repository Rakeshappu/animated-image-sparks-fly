#!/bin/bash
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Add types/jsonwebtoken
echo "Installing additional type definitions..."
npm install --save-dev @types/jsonwebtoken

# Add build:dev script to package.json using jq (needed for Lovable)
echo "Adding build:dev script to package.json..."
if command -v jq &> /dev/null; then
  jq '.scripts."build:dev" = "vite build --mode development"' package.json > tmp.json && mv tmp.json package.json
else
  echo "jq not found, using sed instead to add build:dev script"
  sed -i 's/"scripts": {/"scripts": {\n    "build:dev": "vite build --mode development",/g' package.json
fi

# Build client
echo "Building client..."
npm run build

# Build server with correct TypeScript configuration
echo "Building server..."
npx tsc -p tsconfig.server.json

echo "Build complete!"