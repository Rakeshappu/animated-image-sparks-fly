
#!/bin/bash
# Build script for Render.com deployment

# Install dependencies
npm install

# Create necessary directories
mkdir -p src/assets/images

# Build the project
npm run build

