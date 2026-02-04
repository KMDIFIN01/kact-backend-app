import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const emailConfig = {
  apiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
  fromName: process.env.RESEND_FROM_NAME || 'KACT',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
