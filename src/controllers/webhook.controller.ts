import { Request, Response, NextFunction } from 'express';
import { successResponse } from '@utils/response';
import { InboundEmailService, ResendWebhookPayload } from '@services/inboundEmail.service';

const inboundEmailService = new InboundEmailService();

export class WebhookController {
  inbound = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as ResendWebhookPayload;

      const result = await inboundEmailService.handleEmailReceived(payload);

      successResponse(
        res,
        { received: true, ...result },
        result.isDuplicate ? 'Duplicate event ignored' : 'Webhook processed',
        202
      );
    } catch (error) {
      next(error);
    }
  };
}

