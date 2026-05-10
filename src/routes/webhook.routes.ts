import { Router } from 'express';
import { WebhookController } from '@controllers/webhook.controller';
import { verifyResendWebhookSignature } from '@middlewares/webhookSignature.middleware';

const router = Router();
const webhookController = new WebhookController();

// Inbound webhooks — signature is verified before the controller handles the payload.
// The raw body was captured in app.ts prior to express.json() being applied.
router.post('/inbound', verifyResendWebhookSignature, webhookController.inbound);

export default router;

