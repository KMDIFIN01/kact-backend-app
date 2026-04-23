import { Request, Response } from 'express';
import { EmailService } from '@services/email.service';

const emailService = new EmailService();

export async function sendContactMessage(req: Request, res: Response): Promise<void> {
  const { name, email, subject, message } = req.body as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };

  if (!name || !email || !message) {
    res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    return;
  }

  try {
    await emailService.sendContactEmail(name, email, subject, message);
    res.status(200).json({ success: true, message: 'Your message has been sent successfully.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
}
