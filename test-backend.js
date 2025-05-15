const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');

async function testBackend() {
  console.log(chalk.blue('===== API Connection Tester ====='));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Enter your backend URL:',
      default: 'http://localhost:5000'
    },
    {
      type: 'input',
      name: 'email',
      message: 'Test email (for login test):',
      default: 'test@example.com'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Test password (for login test):',
      default: 'password123'
    }
  ]);
  
  const { baseUrl, email, password } = answers;
  
  // Create axios instance
  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 5000 // 5 seconds timeout
  });
  
  // Test basic connection
  try {
    console.log(chalk.yellow('\n[1/5] Testing basic server connection...'));
    await api.get('/');
    console.log(chalk.green('✓ Server is reachable'));
  } catch (error) {
    handleTestError('Server connection', error);
  }
  
  // Test health endpoint if available
  try {
    console.log(chalk.yellow('\n[2/5] Testing health endpoint...'));
    const health = await api.get('/health');
    console.log(chalk.green('✓ Health endpoint response:'), health.data);
  } catch (error) {
    console.log(chalk.yellow('ℹ Health endpoint not available (this is okay if not implemented)'));
  }
  
  // Test login endpoint
  let authToken = null;
  try {
    console.log(chalk.yellow('\n[3/5] Testing login endpoint...'));
    const loginResponse = await api.post('/api/auth/login', { email, password });
    console.log(chalk.green('✓ Login endpoint working'));
    
    if (loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log(chalk.green('✓ Login returned a token'));
    } else {
      console.log(chalk.yellow('⚠ Login successful but no token returned'));
    }
    
    console.log('Response data:', loginResponse.data);
  } catch (error) {
    handleTestError('Login endpoint', error);
  }
  
  // Test auth check endpoint with token
  if (authToken) {
    try {
      console.log(chalk.yellow('\n[4/5] Testing authentication verification...'));
      const meResponse = await api.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log(chalk.green('✓ Auth verification working'));
      console.log('User data:', meResponse.data);
    } catch (error) {
      handleTestError('Auth verification', error);
    }
  }
  
  // Test server-side environment variables
  try {
    console.log(chalk.yellow('\n[5/5] Testing server environment...'));
    const envResponse = await api.get('/api/system/env-check');
    console.log(chalk.green('✓ Environment check endpoint working'));
    console.log('Environment status:', envResponse.data);
  } catch (error) {
    console.log(chalk.yellow('ℹ Environment check endpoint not available (this is okay if not implemented)'));
  }
  
  console.log(chalk.blue('\n===== Test Complete ====='));
}

function handleTestError(testName, error) {
  console.log(chalk.red(`✗ ${testName} failed`));
  
  if (error.response) {
    // Server responded with non-2xx code
    console.log(chalk.red(`Status code: ${error.response.status}`));
    console.log(chalk.red('Response data:'), error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.log(chalk.red('No response received. Is the server running?'));
  } else {
    // Error setting up request
    console.log(chalk.red(`Request error: ${error.message}`));
  }
}

testBackend().catch(err => {
  console.error(chalk.red('Test script error:'), err);
});