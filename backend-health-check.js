const axios = require('axios');

// Update these values with your backend URL
const baseURL = 'http://localhost:5000'; // or whatever your backend URL is

async function checkBackend() {
  try {
    // Try a simple health check endpoint first
    console.log(`Testing connection to ${baseURL}...`);
    
    try {
      const healthResponse = await axios.get(`${baseURL}/health`);
      console.log('✅ Health check successful:', healthResponse.data);
    } catch (healthErr) {
      console.log('❌ Health check failed. This may be okay if you don\'t have a health endpoint.');
    }
    
    // Try the login endpoint with test credentials
    console.log('\nTesting login endpoint...');
    try {
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ Login endpoint accessible! Response:', loginResponse.data);
    } catch (loginErr) {
      console.log('❌ Login endpoint failed with error:', loginErr.message);
      if (loginErr.response) {
        console.log('Status:', loginErr.response.status);
        console.log('Data:', loginErr.response.data);
      } else if (loginErr.request) {
        console.log('No response received. Is your backend server running?');
      }
    }
  } catch (err) {
    console.error('General error:', err.message);
  }
}

checkBackend();