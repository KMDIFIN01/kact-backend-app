import { Router } from 'express';
import { WebhookController } from '@controllers/webhook.controller';

const router = Router();
const webhookController = new WebhookController();

// Inbound webhooks
router.post('/inbound', webhookController.inbound);

export default router;
