import { Router } from 'express';
import { BroadcastController } from '@controllers/broadcast.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/admin.middleware';
import { broadcastImageUpload } from '@middlewares/upload.middleware';

const router = Router();
const broadcastController = new BroadcastController();

/**
 * @route   POST /api/v1/broadcast/send
 * @desc    Send a broadcast email to all users and members via Resend Broadcasts API
 * @access  Private (Admin/Super only)
 */
router.post('/send', authenticate, requireAdmin, broadcastImageUpload, broadcastController.send);

export default router;
