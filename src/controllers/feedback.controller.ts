import { Request, Response } from 'express';
import { EmailService } from '@services/email.service';

const emailService = new EmailService();

export async function sendFeedbackMessage(req: Request, res: Response): Promise<void> {
  const { name, email, subject, rating, message } = req.body as {
    name: string;
    email: string;
    subject: string;
    rating: number;
    message: string;
  };

  if (!name || !email || !subject || !message) {
    res.status(400).json({ success: false, message: 'All fields are required.' });
    return;
  }

  const parsedRating = Number(rating);
  if (!parsedRating || parsedRating < 1 || parsedRating > 10) {
    res.status(400).json({ success: false, message: 'Rating must be between 1 and 10.' });
    return;
  }

  try {
    await emailService.sendFeedbackEmail(name, email, subject, parsedRating, message);
    res.status(200).json({ success: true, message: 'Feedback sent successfully.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to send feedback. Please try again later.' });
  }
}
