
#!/bin/bash
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Add types/jsonwebtoken
echo "Installing additional type definitions..."
npm install --save-dev @types/jsonwebtoken

# Add dotenv as a dependency if it's not already in package.json
echo "Installing dotenv..."
npm install --save dotenv

# Build client
echo "Building client..."
npm run build

# Create a dist directory if it doesn't exist
echo "Creating dist directory..."
mkdir -p dist

# Build server with correct TypeScript configuration
echo "Building server..."
npx tsc -p tsconfig.server.json

# Copy the server.js file to the dist folder if needed
echo "Ensuring server.js is in the dist folder..."
if [ -f "./dist/src/server.js" ]; then
  cp ./dist/src/server.js ./dist/server.js
fi

# Create a simple check to verify the server file exists
if [ -f "./dist/server.js" ]; then
  echo "✅ Server file successfully created at ./dist/server.js"
else
  echo "❌ Error: Server file not found at ./dist/server.js"
  
  # Debug: List contents of dist directory
  echo "Contents of dist directory:"
  ls -la ./dist
  
  # If server.js exists in a different location, copy it
  find ./dist -name "server.js" -exec cp {} ./dist/server.js \;
fi

echo "Build complete!"
