import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '@services/announcement.service';
import { successResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';

export class AnnouncementController {
  private announcementService: AnnouncementService;

  constructor() {
    this.announcementService = new AnnouncementService();
  }

  send = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subject, body } = req.body as {
        subject?: unknown;
        body?: unknown;
      };

      if (typeof subject !== 'string' || subject.trim().length === 0) {
        throw new BadRequestError('subject is required');
      }
      if (typeof body !== 'string' || body.trim().length === 0) {
        throw new BadRequestError('body is required');
      }

      const result = await this.announcementService.sendAnnouncement(
        subject.trim(),
        body.trim(),
        (req.files as Express.Multer.File[]) ?? []
      );

      successResponse(res, result, 'Announcement sent successfully');
    } catch (error) {
      next(error);
    }
  };
}
