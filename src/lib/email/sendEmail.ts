// Check if the function exists, if not define it
export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  try {
    // This is a placeholder function if it doesn't exist in the codebase
    // In a real implementation, this would use nodemailer or a similar service
    console.log(`Sending email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    
    // Implement your email sending logic here
    // For now, we'll just return a successful response
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

import { transporter } from './config';
import { getVerificationEmailTemplate } from './templates';

export async function sendVerificationEmail(email: string, token: string, otp: string) {
  try {
    console.log('Attempting to send verification email to:', email);
    console.log('Sending verification email with OTP:', otp);
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    
    console.log('Verification link:', verificationLink);

    const mailOptions = {
      from: `"Versatile Share" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Versatile Share Verification Code',
      html: getVerificationEmailTemplate(otp)
    };

    console.log('Mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      recipient: email,
      preview: info.messageId ? `https://mailtrap.io/inboxes/test/messages/${info.messageId}` : undefined
    });

    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error(`Failed to send verification email: ${String(error)}`);
  }
}
