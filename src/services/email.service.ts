import { Resend } from 'resend';
import { emailConfig } from '@config/email';
import { verificationEmailTemplate, verificationEmailText } from '../templates/verificationEmail';
import { passwordResetEmailTemplate, passwordResetEmailText } from '../templates/passwordResetEmail';

export class EmailService {
  private resend: Resend;

  constructor() {
    if (!emailConfig.apiKey || emailConfig.apiKey === '') {
      console.warn('⚠️  RESEND_API_KEY is not configured. Email functionality will be disabled.');
      console.warn('⚠️  Get your API key from https://resend.com/api-keys');
    }
    this.resend = new Resend(emailConfig.apiKey);
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${emailConfig.frontendUrl}/verify-email?token=${token}`;
    
    try {
      await this.resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: email,
        subject: 'Verify Your Email Address - KACT',
        html: verificationEmailTemplate(name, verificationUrl),
        text: verificationEmailText(name, verificationUrl),
      });
      console.log(`✉️ Verification email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${emailConfig.frontendUrl}/reset-password?token=${token}`;
    
    try {
      await this.resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: email,
        subject: 'Reset Your Password - KACT',
        html: passwordResetEmailTemplate(name, resetUrl),
        text: passwordResetEmailText(name, resetUrl),
      });
      console.log(`✉️ Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: email,
        subject: 'Welcome to KACT!',
        html: `
          <h1>Welcome to KACT, ${name}!</h1>
          <p>Your email has been successfully verified. You can now access all features of your account.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The KACT Team</p>
        `,
        text: `Welcome to KACT, ${name}!\n\nYour email has been successfully verified. You can now access all features of your account.\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe KACT Team`,
      });
      console.log(`✉️ Welcome email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error for welcome email as it's not critical
    }
  }
}
