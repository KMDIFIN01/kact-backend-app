import { Resend } from 'resend';
import { emailConfig } from '@config/email';
import { verificationEmailTemplate, verificationEmailText } from '../templates/verificationEmail';
import { passwordResetEmailTemplate, passwordResetEmailText } from '../templates/passwordResetEmail';
import { registrationSuccessEmailTemplate, registrationSuccessEmailText } from '../templates/registrationSuccessEmail';

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

  async sendRegistrationSuccessEmail(email: string, name: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: email,
        subject: 'Registration Successful - KACT',
        html: registrationSuccessEmailTemplate(name),
        text: registrationSuccessEmailText(name),
      });
      console.log(`✉️ Registration success email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send registration success email:', error);
      // Don't throw error for registration success email as it's not critical
    }
  }
}
