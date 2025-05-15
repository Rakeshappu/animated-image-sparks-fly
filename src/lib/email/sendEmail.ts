
// Check if the function exists, if not define it
export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  try {
    // This is a placeholder function if it doesn't exist in the codebase
    // In a real implementation, this would use nodemailer or a similar service
    console.log(`Sending email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    
    // For testing, we'll simulate sending the email
    // In production, replace this with actual email sending logic
    console.log('Email sending simulated successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Add these functions to support the auth controller
export const sendVerificationEmail = async (email: string, name: string, otp: string) => {
  const subject = 'Verify Your Email';
  const html = `
    <h1>Welcome to VersatileShare!</h1>
    <p>Hello ${name},</p>
    <p>Thank you for signing up. Please use the following code to verify your email:</p>
    <h2 style="font-size: 24px; letter-spacing: 5px; background: #f0f0f0; padding: 10px; text-align: center;">${otp}</h2>
    <p>This code will expire in 24 hours.</p>
  `;
  
  return sendEmail({ to: email, subject, html });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const subject = 'Welcome to VersatileShare!';
  const html = `
    <h1>Welcome to VersatileShare!</h1>
    <p>Hello ${name},</p>
    <p>Your email has been verified successfully. You can now enjoy all the features of VersatileShare.</p>
    <p>Thank you for joining us!</p>
  `;
  
  return sendEmail({ to: email, subject, html });
};
