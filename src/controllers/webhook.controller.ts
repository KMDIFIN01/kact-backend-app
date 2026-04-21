import { Request, Response, NextFunction } from 'express';
import { successResponse } from '@utils/response';

export class WebhookController {
  inbound = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Placeholder webhook handler: payload is accepted and acknowledged.
      successResponse(
        res,
        {
          received: true,
          timestamp: new Date().toISOString(),
          payload: req.body,
        },
        'Webhook received',
        202
      );
    } catch (error) {
      next(error);
    }
  };
}
