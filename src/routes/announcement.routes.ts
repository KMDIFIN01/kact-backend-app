import { Router } from 'express';
import { AnnouncementController } from '@controllers/announcement.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/admin.middleware';
import { announcementUpload } from '@middlewares/upload.middleware';

const router = Router();
const announcementController = new AnnouncementController();

/**
 * @route   POST /api/v1/announcement/send
 * @desc    Send an announcement email to all users, members, or both
 * @access  Private (Admin/Super only)
 */
router.post('/send', authenticate, requireAdmin, announcementUpload, announcementController.send);

export default router;
