import { Router } from 'express';
import { SponsorFlyerController } from '@controllers/sponsorFlyer.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/admin.middleware';
import { galleryUpload } from '@middlewares/upload.middleware';

const router = Router();
const controller = new SponsorFlyerController();

/**
 * @route   POST /api/v1/sponsor-flyers/upload
 * @desc    Upload a sponsor tier flyer
 * @access  Private (Admin only)
 */
router.post('/upload', authenticate, requireAdmin, galleryUpload, controller.upload);

/**
 * @route   GET /api/v1/sponsor-flyers
 * @desc    Get all sponsor flyers (grouped by tier on frontend)
 * @access  Public
 */
router.get('/', controller.getAll);

/**
 * @route   DELETE /api/v1/sponsor-flyers/:id
 * @desc    Delete a sponsor flyer
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, controller.delete);

export default router;
