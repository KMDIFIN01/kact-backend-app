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
        to: ['kmdifin01@gmail.com', 'mykact@gmail.com'],
        replyTo: senderEmail,
        subject: `[KACT Contact] ${subjectLabel}`,
        html: `<p><strong>From:</strong> ${senderName}</p><p><strong>Email:</strong> ${senderEmail}</p><p><strong>Subject:</strong> ${subjectLabel}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`,
        text: `From: ${senderName}\nEmail: ${senderEmail}\nSubject: ${subjectLabel}\n\n${message}`,
      });
      console.log(`✉️ Contact email from ${senderEmail} sent to kmdifin01@gmail.com and mykact@gmail.com`);
    } catch (error) {
      console.error('Failed to send contact email:', error);
      throw new Error('Failed to send contact email');
    }
  }

  async sendFeedbackEmail({
    senderName,
    senderEmail,
    subject,
    isEventRelated,
    eventRating,
    foodRating,
    enjoyedMost,
    generalFeedback,
    improvements,
    additionalComments,
  }: {
    senderName: string;
    senderEmail: string;
    subject: string;
    isEventRelated: boolean;
    eventRating?: number;
    foodRating?: number;
    enjoyedMost?: string;
    generalFeedback?: string;
    improvements: string;
    additionalComments?: string;
  }): Promise<void> {
    const eventStars = eventRating
      ? `${eventRating}/5 ${'★'.repeat(eventRating)}${'☆'.repeat(5 - eventRating)}`
      : 'Not provided';
    const foodStars = foodRating
      ? `${foodRating}/5 ${'★'.repeat(foodRating)}${'☆'.repeat(5 - foodRating)}`
      : 'Not provided';

    const detailsHtml = isEventRelated
      ? `
          <p><strong>How would you rate this event overall?</strong> ${eventStars}</p>
          <p><strong>How would you rate the food provided?</strong> ${foodStars}</p>
          <p><strong>What did you enjoy most about the event?</strong></p>
          <p style="white-space:pre-wrap;">${enjoyedMost || 'Not provided'}</p>
          <p><strong>What areas do you feel could be improved?</strong></p>
          <p style="white-space:pre-wrap;">${improvements}</p>
          <p><strong>Any additional comments or suggestions for future events?</strong></p>
          <p style="white-space:pre-wrap;">${additionalComments || 'Not provided'}</p>
        `
      : `
          <p><strong>Feedback</strong></p>
          <p style="white-space:pre-wrap;">${generalFeedback || 'Not provided'}</p>
          <p><strong>What areas do you feel could be improved?</strong></p>
          <p style="white-space:pre-wrap;">${improvements}</p>
        `;

    const detailsText = isEventRelated
      ? `How would you rate this event overall? ${eventStars}\nHow would you rate the food provided? ${foodStars}\nWhat did you enjoy most about the event?\n${enjoyedMost || 'Not provided'}\n\nWhat areas do you feel could be improved?\n${improvements}\n\nAny additional comments or suggestions for future events?\n${additionalComments || 'Not provided'}`
      : `Feedback\n${generalFeedback || 'Not provided'}\n\nWhat areas do you feel could be improved?\n${improvements}`;

    try {
      await this.resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: ['kmdifin01@gmail.com', 'mykact@gmail.com'],
        ...(senderEmail && { replyTo: senderEmail }),
        subject: `[KACT Feedback] ${subject}`,
        html: `
          <h2 style="color:#0066B3;">KACT Community Feedback</h2>
          <p><strong>From:</strong> ${senderName}</p>
          <p><strong>Email:</strong> ${senderEmail || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr/>
          ${detailsHtml}
        `,
        text: `KACT Community Feedback\n\nFrom: ${senderName}\nEmail: ${senderEmail || 'Not provided'}\nSubject: ${subject}\n\n${detailsText}`,
      });
      console.log(`✉️ Feedback email from ${senderEmail} sent to kmdifin01@gmail.com and mykact@gmail.com`);
    } catch (error) {
      console.error('Failed to send feedback email:', error);
      throw new Error('Failed to send feedback email');
    }
  }
}
