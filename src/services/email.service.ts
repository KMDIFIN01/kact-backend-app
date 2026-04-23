import { Resend } from 'resend';
import { emailConfig } from '@config/email';
import { verificationEmailTemplate, verificationEmailText } from '../templates/verificationEmail';
import { passwordResetEmailTemplate, passwordResetEmailText } from '../templates/passwordResetEmail';
import { registrationSuccessEmailTemplate, registrationSuccessEmailText } from '../templates/registrationSuccessEmail';
import { applicationSubmittedEmailTemplate, applicationSubmittedEmailText } from '../templates/applicationSubmittedEmail';
import { applicationStatusEmailTemplate, applicationStatusEmailText } from '../templates/applicationStatusEmail';


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

  async sendApplicationSubmittedEmail(email: string, name: string, applicationType: 'membership' | 'sponsorship'): Promise<void> {
    const typeLabel = applicationType === 'membership' ? 'Membership' : 'Sponsorship';
    try {
      await this.resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: email,
        subject: `${typeLabel} Application Received - KACT`,
        html: applicationSubmittedEmailTemplate(name, applicationType),
        text: applicationSubmittedEmailText(name, applicationType),
      });
      console.log(`✉️ ${typeLabel} application email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send ${typeLabel.toLowerCase()} application email:`, error);
      // Don't throw error as it's not critical
    }
  }

  async sendApplicationStatusEmail(email: string, name: string, applicationType: 'membership' | 'sponsorship', status: 'APPROVED' | 'REJECTED'): Promise<void> {
    const typeLabel = applicationType === 'membership' ? 'Membership' : 'Sponsorship';
    const statusLabel = status === 'APPROVED' ? 'Approved' : 'Rejected';
    try {
      await this.resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: email,
        subject: `${typeLabel} Application ${statusLabel} - KACT`,
        html: applicationStatusEmailTemplate(name, applicationType, status),
        text: applicationStatusEmailText(name, applicationType, status),
      });
      console.log(`✉️ ${typeLabel} ${statusLabel.toLowerCase()} email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send ${typeLabel.toLowerCase()} status email:`, error);
      // Don't throw error as it's not critical
    }
  }

  async sendContactEmail(senderName: string, senderEmail: string, subject: string, message: string): Promise<void> {
    const subjectLabel = subject
      ? subject.charAt(0).toUpperCase() + subject.slice(1)
      : 'General Inquiry';
    try {
      await this.resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: 'kmdifin01@gmail.com',
        replyTo: senderEmail,
        subject: `[KACT Contact] ${subjectLabel}`,
        html: `<p><strong>From:</strong> ${senderName}</p><p><strong>Email:</strong> ${senderEmail}</p><p><strong>Subject:</strong> ${subjectLabel}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`,
        text: `From: ${senderName}\nEmail: ${senderEmail}\nSubject: ${subjectLabel}\n\n${message}`,
      });
      console.log(`✉️ Contact email from ${senderEmail} sent to kmdifin01@gmail.com`);
    } catch (error) {
      console.error('Failed to send contact email:', error);
      throw new Error('Failed to send contact email');
    }
  }

  async sendFeedbackEmail(
    senderName: string,
    senderEmail: string,
    subject: string,
    rating: number,
    message: string,
  ): Promise<void> {
    const stars = '★'.repeat(rating) + '☆'.repeat(10 - rating);
    try {
      await this.resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: 'kmdifin01@gmail.com',
        replyTo: senderEmail,
        subject: `[KACT Feedback] ${subject}`,
        html: `
          <h2 style="color:#0066B3;">KACT Community Feedback</h2>
          <p><strong>From:</strong> ${senderName}</p>
          <p><strong>Email:</strong> ${senderEmail}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Satisfaction Rating:</strong> ${rating}/10 &nbsp; ${stars}</p>
          <hr/>
          <p><strong>Feedback:</strong></p>
          <p style="white-space:pre-wrap;">${message}</p>
        `,
        text: `KACT Community Feedback\n\nFrom: ${senderName}\nEmail: ${senderEmail}\nSubject: ${subject}\nRating: ${rating}/10\n\n${message}`,
      });
      console.log(`✉️ Feedback email from ${senderEmail} sent to kmdifin01@gmail.com`);
    } catch (error) {
      console.error('Failed to send feedback email:', error);
      throw new Error('Failed to send feedback email');
    }
  }
}
