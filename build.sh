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
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('./package.json')); if (!pkg.scripts['build:dev']) { pkg.scripts['build:dev'] = 'vite build --mode development'; fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n'); }"

# Build client
echo "Building client..."
npm run build

# Build server with correct TypeScript configuration
echo "Building server..."
npx tsc -p tsconfig.server.json

echo "Build complete!"