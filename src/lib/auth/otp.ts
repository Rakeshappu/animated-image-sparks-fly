
/**
 * Utility functions for generating and validating OTPs
 */

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generates a numeric OTP of specified length
 * @returns string A numeric OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validates if an OTP is correct and not expired
 * @param inputOTP The OTP entered by the user
 * @param storedOTP The OTP stored in the system
 * @param createdAt When the OTP was created
 * @returns boolean True if OTP is valid, false otherwise
 */
export function validateOTP(inputOTP: string, storedOTP: string, createdAt: Date): boolean {
  // Check if OTP matches
  if (inputOTP !== storedOTP) {
    console.log('OTP validation failed: OTPs do not match');
    return false;
  }
  
  // Check if OTP is expired
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  if (now > expiryTime) {
    console.log('OTP validation failed: OTP expired');
    return false;
  }
  
  return true;
}

/**
 * Generates a masked version of an email for display purposes
 * @param email The email to mask
 * @returns string The masked email
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const name = parts[0];
  const domain = parts[1];
  
  const maskedName = name.length <= 3 
    ? name[0] + '***' 
    : name.substring(0, 2) + '***' + name.substring(name.length - 1);
    
  return `${maskedName}@${domain}`;
}
