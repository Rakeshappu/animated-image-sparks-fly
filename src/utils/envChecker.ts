export function checkEnvironment() {
  console.log('=== Environment Variables Check ===');
  
  // Check API URL
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    console.error('❌ VITE_API_URL is missing! API calls will fail.');
    console.log('   Create a .env file with VITE_API_URL=http://localhost:5000 (or your backend URL)');
  } else {
    console.log(`✅ VITE_API_URL is set to: ${apiUrl}`);
  }
  
  // Check if running in development mode
  console.log(`🔧 Running in ${import.meta.env.MODE} mode`);
  
  // Check if localStorage is accessible (for token storage)
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('✅ localStorage is accessible');
  } catch (e) {
    console.error('❌ localStorage is not accessible. Authentication will fail!');
  }
  
  // Check JWT token if available
  const token = localStorage.getItem('token');
  if (token) {
    console.log('✅ JWT token found in localStorage');
    try {
      // Very basic JWT validation (checks structure only)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('⚠️ Token doesn\'t look like a valid JWT (should have 3 parts)');
      }
    } catch (e) {
      console.warn('⚠️ Could not check token format');
    }
  } else {
    console.log('ℹ️ No JWT token found (this is normal if not logged in)');
  }
  
  console.log('=== Environment Check Complete ===');
}