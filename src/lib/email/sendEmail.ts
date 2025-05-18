
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

export async function sendPasswordResetEmail(email: string, fullName: string, otp: string) {
  try {
    console.log('Attempting to send password reset email to:', email);
    console.log('Sending password reset email with OTP:', otp);
    
    const mailOptions = {
      from: `"Versatile Share" <${process.env.EMAIL_USER || 'noreply@example.com'}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset</h2>
          <p>Hello ${fullName},</p>
          <p>We received a request to reset your password. Use the code below to reset your password:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h3 style="font-size: 24px; margin: 0; letter-spacing: 5px; color: #4F46E5;">${otp}</h3>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support.</p>
          <p>Thank you,<br>VersatileShare Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Password reset email sent successfully:', {
      messageId: info.messageId,
      recipient: email
    });

    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error(`Failed to send password reset email: ${String(error)}`);
  }
}
