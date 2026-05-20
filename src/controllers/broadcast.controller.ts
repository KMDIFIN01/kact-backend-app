import { Request, Response, NextFunction } from 'express';
import { BroadcastService } from '@services/broadcast.service';
import { successResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';

export class BroadcastController {
  private broadcastService: BroadcastService;

  constructor() {
    this.broadcastService = new BroadcastService();
  }

  send = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subject, body, recipients } = req.body as { subject?: unknown; body?: unknown; recipients?: unknown };

      if (typeof subject !== 'string' || subject.trim().length === 0) {
        throw new BadRequestError('subject is required');
      }
      if (subject.trim().length > 200) {
        throw new BadRequestError('subject must be 200 characters or fewer');
      }
      if (typeof body !== 'string' || body.trim().length === 0) {
        throw new BadRequestError('body is required');
      }
      if (body.trim().length > 50000) {
        throw new BadRequestError('body must be 50,000 characters or fewer');
      }

      // Validate recipients parameter
      const validRecipients = ['users', 'members', 'both'];
      const recipientsValue = typeof recipients === 'string' && validRecipients.includes(recipients) ? recipients : 'both';

      const result = await this.broadcastService.sendBroadcast(
        subject.trim(),
        body.trim(),
        recipientsValue as 'users' | 'members' | 'both'
      );

      successResponse(res, result, 'Broadcast sent successfully');
    } catch (error) {
      next(error);
    }
  };
}
