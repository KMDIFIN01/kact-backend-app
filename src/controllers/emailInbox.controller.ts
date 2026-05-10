import { Request, Response, NextFunction } from 'express';
import { successResponse } from '@utils/response';
import { BadRequestError, NotFoundError } from '@utils/errors';
import { EmailInboxService, SendReplyInput } from '@services/emailInbox.service';

const emailInboxService = new EmailInboxService();

export class EmailInboxController {
  /** GET /api/v1/email-inbox/threads?page=1&limit=20&unreadOnly=false */
  listThreads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await emailInboxService.listThreads({ page, limit, unreadOnly });
      successResponse(res, result, 'Threads retrieved');
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/email-inbox/threads/:threadId */
  getThread = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const threadId = req.params['threadId'] as string;
      const thread = await emailInboxService.getThread(threadId);
      if (!thread) throw new NotFoundError('Thread not found');
      successResponse(res, { thread }, 'Thread retrieved');
    } catch (error) {
      next(error);
    }
  };

  /** POST /api/v1/email-inbox/threads/:threadId/reply */
  sendReply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const threadId = req.params['threadId'] as string;
      const { toAddresses, ccAddresses, subject, textBody, htmlBody } = req.body as Partial<SendReplyInput>;

      if (!toAddresses || !Array.isArray(toAddresses) || toAddresses.length === 0) {
        throw new BadRequestError('toAddresses must be a non-empty array');
      }
      if (!subject || typeof subject !== 'string') {
        throw new BadRequestError('subject is required');
      }
      if (!textBody && !htmlBody) {
        throw new BadRequestError('At least one of textBody or htmlBody is required');
      }

      const result = await emailInboxService.sendReply({
        threadId,
        toAddresses,
        ccAddresses,
        subject,
        textBody,
        htmlBody,
      });

      successResponse(res, result, 'Reply sent', 201);
    } catch (error) {
      next(error);
    }
  };

  /** PATCH /api/v1/email-inbox/threads/:threadId/read */
  markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const threadId = req.params['threadId'] as string;
      const { isRead } = req.body as { isRead?: boolean };
      await emailInboxService.markThread(threadId, isRead !== false);
      successResponse(res, null, 'Thread updated');
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /api/v1/email-inbox/threads/:threadId */
  deleteThread = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const threadId = req.params['threadId'] as string;
      await emailInboxService.deleteThread(threadId);
      successResponse(res, null, 'Thread deleted');
    } catch (error) {
      next(error);
    }
  };
}
