import { Router } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/admin.middleware';
import { EmailInboxController } from '@controllers/emailInbox.controller';

const router = Router();
const emailInboxController = new EmailInboxController();

// All email inbox routes require authentication + admin (or super) role.
router.use(authenticate, requireAdmin);

router.get('/threads', emailInboxController.listThreads);
router.get('/threads/:threadId', emailInboxController.getThread);
router.post('/threads/:threadId/reply', emailInboxController.sendReply);
router.patch('/threads/:threadId/read', emailInboxController.markRead);
router.delete('/threads/:threadId', emailInboxController.deleteThread);

export default router;
