# VersatileShare

## Deployment Instructions for Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure the following settings:
   - Name: versatile-share
   - Environment: Node.js
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Port: 8080

### Environment Variables
Set the following environment variables in your Render dashboard:
- NODE_ENV: production
- PORT: 8080

### Database Setup
This application requires MongoDB. Make sure to provision a MongoDB database and add the connection string as an environment variable:
- MONGODB_URI: your-mongodb-connection-string

### Troubleshooting
If you encounter any deployment issues, check:
1. The build logs in the Render dashboard
2. Make sure all environment variables are correctly set
3. Verify that the build and start commands are working locally