import { Router } from 'express';
import { sendContactMessage } from '@controllers/contact.controller';
import { generalLimiter } from '@middlewares/rateLimiter.middleware';

const router = Router();

router.post('/', generalLimiter, sendContactMessage);

export default router;
