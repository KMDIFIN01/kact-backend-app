import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const emailConfig = {
  apiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@kactusa.org',
  fromName: process.env.RESEND_FROM_NAME || 'KACT',
  replyEmail: process.env.RESEND_REPLY_EMAIL || process.env.RESEND_FROM_EMAIL || 'contact@kactusa.org',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
