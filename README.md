# VersatileShare

## Important Note for Building the Project

Before deploying, make sure to add a `build:dev` script to the package.json file:

```json
"scripts": {
  "build:dev": "vite build --mode development",
  // other scripts...
}
```

## Manual Package.json Update (Required!)

⚠️ **IMPORTANT** ⚠️

You **MUST** manually add the following script to your package.json file:

```bash
npm pkg set "scripts.build:dev=vite build --mode development"
```

This script is required for Lovable to build the project.

## Deployment Instructions for Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure the following settings:
   - Name: versatile-share
   - Environment: Node.js
   - Build Command: `./build.sh`
   - Start Command: `node dist/server.js`
   - Port: 8080

### Environment Variables
Set the following environment variables in your Render dashboard:
- NODE_ENV: production
- PORT: 8080
- MONGODB_URI: your-mongodb-connection-string
- JWT_SECRET: will be automatically generated

### Database Setup
This application requires MongoDB. Make sure to provision a MongoDB database and add the connection string as an environment variable:
- MONGODB_URI: your-mongodb-connection-string

### Troubleshooting
If you encounter any deployment issues, check:
1. The build logs in the Render dashboard
2. Make sure all environment variables are correctly set
3. Verify that the build and start commands are working locally
4. Ensure you've added the `build:dev` script to your package.json
5. Check the Node.js version on Render (should be 18.x or later)
