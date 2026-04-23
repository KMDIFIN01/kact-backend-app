import { Router } from 'express';
import { sendFeedbackMessage } from '@controllers/feedback.controller';
import { generalLimiter } from '@middlewares/rateLimiter.middleware';

const router = Router();

router.post('/', generalLimiter, sendFeedbackMessage);

export default router;
