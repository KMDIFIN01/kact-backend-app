import { Request, Response } from 'express';
import { EmailService } from '@services/email.service';

const emailService = new EmailService();
const EVENT_RELATED_SUBJECTS = new Set([
  'Annual Cultural Events',
  'Onam Celebration',
  'Celebration of Unity - Talent Show',
  'Christmas Celebration',
  "Women's Day Event",
  "Purushu-Men's Day",
  'Cultural Night Programs',
]);

export async function sendFeedbackMessage(req: Request, res: Response): Promise<void> {
  const {
    name,
    email,
    subject,
    eventRating,
    foodRating,
    enjoyedMost,
    generalFeedback,
    improvements,
    additionalComments,
  } = req.body as {
    name?: string;
    email?: string;
    subject: string;
    eventRating?: number;
    foodRating?: number;
    enjoyedMost?: string;
    generalFeedback?: string;
    improvements?: string;
    additionalComments?: string;
  };

  if (!subject) {
    res.status(400).json({ success: false, message: 'Subject is required.' });
    return;
  }

  const normalizedName = name?.trim() || 'Anonymous';
  const normalizedEmail = email?.trim() || '';
  const normalizedEnjoyedMost = enjoyedMost?.trim() || '';
  const normalizedGeneralFeedback = generalFeedback?.trim() || '';
  const normalizedImprovements = improvements?.trim() || '';
  const normalizedAdditionalComments = additionalComments?.trim() || '';
  const isEventRelated = EVENT_RELATED_SUBJECTS.has(subject);

  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    return;
  }

  if (isEventRelated) {
    const parsedEventRating = Number(eventRating);
    const parsedFoodRating = Number(foodRating);
    if (!parsedEventRating || parsedEventRating < 1 || parsedEventRating > 5) {
      res.status(400).json({ success: false, message: 'Event rating must be between 1 and 5.' });
      return;
    }
    if (!parsedFoodRating || parsedFoodRating < 1 || parsedFoodRating > 5) {
      res.status(400).json({ success: false, message: 'Food rating must be between 1 and 5.' });
      return;
    }
    if (!normalizedEnjoyedMost || !normalizedImprovements) {
      res.status(400).json({ success: false, message: 'Please answer all required event feedback questions.' });
      return;
    }
  } else if (!normalizedGeneralFeedback || !normalizedImprovements) {
    res.status(400).json({ success: false, message: 'General feedback and improvements are required.' });
    return;
  }

  if (
    normalizedEnjoyedMost.length > 500 ||
    normalizedGeneralFeedback.length > 500 ||
    normalizedImprovements.length > 500 ||
    normalizedAdditionalComments.length > 500
  ) {
    res.status(400).json({ success: false, message: 'Each text response must be 500 characters or less.' });
    return;
  }

  try {
    await emailService.sendFeedbackEmail({
      senderName: normalizedName,
      senderEmail: normalizedEmail,
      subject,
      isEventRelated,
      eventRating: Number(eventRating) || undefined,
      foodRating: Number(foodRating) || undefined,
      enjoyedMost: normalizedEnjoyedMost || undefined,
      generalFeedback: normalizedGeneralFeedback || undefined,
      improvements: normalizedImprovements,
      additionalComments: normalizedAdditionalComments || undefined,
    });
    res.status(200).json({ success: true, message: 'Feedback sent successfully.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to send feedback. Please try again later.' });
  }
}
