
import { transporter } from './config';
import { getVerificationEmailTemplate } from './templates';

export async function sendVerificationEmail(email: string, token: string, otp: string) {
  try {
    console.log('Attempting to send verification email to:', email);
    console.log('Sending verification email with OTP:', otp);
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
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
