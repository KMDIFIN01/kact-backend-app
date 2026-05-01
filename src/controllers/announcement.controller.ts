import { Request, Response, NextFunction } from 'express';
import { AnnouncementService, AnnouncementRecipients } from '@services/announcement.service';
import { successResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';

const VALID_RECIPIENTS: AnnouncementRecipients[] = ['users', 'members', 'both'];

export class AnnouncementController {
  private announcementService: AnnouncementService;

  constructor() {
    this.announcementService = new AnnouncementService();
  }

  send = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subject, body, recipients } = req.body as {
        subject?: unknown;
        body?: unknown;
        recipients?: unknown;
      };

      if (typeof subject !== 'string' || subject.trim().length === 0) {
        throw new BadRequestError('subject is required');
      }
      if (typeof body !== 'string' || body.trim().length === 0) {
        throw new BadRequestError('body is required');
      }
      if (!VALID_RECIPIENTS.includes(recipients as AnnouncementRecipients)) {
        throw new BadRequestError(`recipients must be one of: ${VALID_RECIPIENTS.join(', ')}`);
      }

      const result = await this.announcementService.sendAnnouncement(
        subject.trim(),
        body.trim(),
        recipients as AnnouncementRecipients,
        (req.files as Express.Multer.File[]) ?? []
      );

      successResponse(res, result, 'Announcement sent successfully');
    } catch (error) {
      next(error);
    }
  };
}
